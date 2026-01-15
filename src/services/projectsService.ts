/**
 * Projects Service
 * 
 * Handles CRUD operations for projects using Supabase.
 * Maps between frontend SavedProject type and Supabase tables.
 */

import { supabase } from '../lib/supabase';
import type { SavedProject, ColoringPage } from '../types';
import { uploadProjectImage, getSignedUrl } from './storageService';

// Type for the joined query result
interface ProjectWithColoringData {
    id: string;
    public_id: string;
    title: string;
    description: string | null;
    cover_image_url: string | null;
    user_id: string | null;
    created_at: string;
    updated_at: string;
    coloring_studio_data: {
        style: string | null;
        audience: string | null;
        complexity: string | null;
        page_count: number | null;
    } | null;
}

// Type for image record in DB
interface DbImage {
    id: string;
    project_id: string;
    storage_path: string;
    type: string;
    metadata: any;
    filename: string | null;
    generation_prompt: string | null;
}

/**
 * Generate a public ID for a project (e.g., CB847291)
 */
function generatePublicId(): string {
    const prefix = 'CB'; // Coloring Book
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    return `${prefix}${randomNum}`;
}

/**
 * Fetch all projects for the current user
 */
export async function fetchUserProjects(): Promise<SavedProject[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.warn('No authenticated user');
        return [];
    }

    const { data, error } = await supabase
        .from('projects')
        .select(`
            id,
            public_id,
            title,
            description,
            cover_image_url,
            user_id,
            created_at,
            updated_at,
            coloring_studio_data (
                style,
                audience,
                complexity,
                page_count
            )
        `)
        .eq('user_id', user.id)
        .eq('tool_type', 'coloring_studio')
        .eq('is_archived', false)
        .order('updated_at', { ascending: false });

    if (error) {
        console.error('Error fetching projects:', error);
        throw error;
    }

    // Map without pages (list view doesn't need full pages)
    return (data as ProjectWithColoringData[]).map(r => mapDbToSavedProject(r));
}

/**
 * Fetch a single project by its public ID
 * Now also fetches and signs image URLs
 */
export async function fetchProject(publicId: string): Promise<SavedProject | null> {
    // 1. Fetch Project Data
    const { data: projectData, error } = await supabase
        .from('projects')
        .select(`
            id,
            public_id,
            title,
            description,
            cover_image_url,
            user_id,
            created_at,
            updated_at,
            coloring_studio_data (
                style,
                audience,
                complexity,
                page_count
            )
        `)
        .eq('public_id', publicId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        console.error('Error fetching project:', error);
        throw error;
    }

    // 2. Fetch Images for this project
    const { data: imagesData, error: imagesError } = await supabase
        .from('images')
        .select('*')
        .eq('project_id', (projectData as ProjectWithColoringData).id)
        .eq('type', 'page');

    if (imagesError) {
        console.error('Error fetching project images:', imagesError);
        // Fallback: return project without pages
        return mapDbToSavedProject(projectData as ProjectWithColoringData);
    }

    // 3. Convert DB Images to ColoringPages & Get Signed URLs
    const pages: ColoringPage[] = await Promise.all(
        (imagesData as DbImage[]).map(async (img) => {
            const signedUrl = await getSignedUrl(img.storage_path);

            return {
                id: img.id,
                imageUrl: signedUrl,
                prompt: img.generation_prompt || '',
                // Restore metadata
                pageIndex: img.metadata?.pageIndex ?? 0,
                status: img.metadata?.status ?? 'complete',
                isLoading: false,
                isCover: img.metadata?.isCover ?? false
            };
        })
    );

    // Sort by pageIndex
    pages.sort((a, b) => (a.pageIndex ?? 0) - (b.pageIndex ?? 0));

    // 4. Combine and return
    const project = mapDbToSavedProject(projectData as ProjectWithColoringData);
    project.pages = pages;

    return project;
}

/**
 * Save a project (create or update)
 * Handles uploading new images to R2 and saving standard metadata
 */
export async function saveProject(project: SavedProject): Promise<SavedProject> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error('Not authenticated');
    }

    // Check if project exists (by ID)
    const isUpdate = !!project.id && !project.id.startsWith('temp-') && project.id.startsWith('CB');

    let projectId: string; // Internal UUID
    let publicId: string;

    if (isUpdate) {
        // Update existing project
        const { data: existingProject, error: fetchError } = await supabase
            .from('projects')
            .select('id, public_id')
            .eq('public_id', project.id)
            .single();

        if (fetchError || !existingProject) {
            // Fallback: create new if not found by public ID
            const newProj = await createNewProjectDbOnly(user.id, project);
            projectId = newProj.id;
            publicId = newProj.public_id;
        } else {
            projectId = existingProject.id;
            publicId = existingProject.public_id;

            // Update projects table
            await supabase
                .from('projects')
                .update({
                    title: project.projectName,
                    description: project.userPrompt,
                    cover_image_url: project.thumbnail || null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', projectId);

            // Update coloring_studio_data
            await supabase
                .from('coloring_studio_data')
                .upsert({
                    project_id: projectId,
                    style: project.visualStyle,
                    audience: project.targetAudienceId,
                    complexity: project.complexity,
                    page_count: project.pageAmount
                });
        }

    } else {
        // Create new project
        const result = await createNewProjectDbOnly(user.id, project);
        projectId = result.id;
        publicId = result.public_id;
    }

    // Handle Image Uploads & Persistence
    let updatedPages = project.pages || [];
    if (updatedPages.length > 0) {
        updatedPages = await persistProjectImages(projectId, updatedPages);
    }

    // Return updated project
    return {
        ...project,
        id: publicId,
        pages: updatedPages,
        updatedAt: Date.now()
    };
}

/**
 * Internal helper to create DB records for a new project
 */
async function createNewProjectDbOnly(userId: string, project: SavedProject) {
    const publicId = generatePublicId();

    const { data: newProject, error: insertError } = await supabase
        .from('projects')
        .insert({
            public_id: publicId,
            tool_type: 'coloring_studio',
            user_id: userId,
            title: project.projectName || 'Untitled Project',
            description: project.userPrompt,
            cover_image_url: project.thumbnail || null
        })
        .select('id, public_id, created_at, updated_at')
        .single();

    if (insertError || !newProject) throw insertError || new Error('Failed to create project');

    await supabase
        .from('coloring_studio_data')
        .insert({
            project_id: newProject.id,
            style: project.visualStyle,
            audience: project.targetAudienceId,
            complexity: project.complexity,
            page_count: project.pageAmount
        });

    return newProject;
}

/**
 * Helper to upload images and save to DB
 * Returns updated pages (e.g. replacing data URL with remote, or keeping as is if error)
 */
async function persistProjectImages(projectId: string, pages: ColoringPage[]): Promise<ColoringPage[]> {
    const updatedPages = [...pages];

    // Process sequentially to be safe with DB or Parallel? Parallel is faster.
    await Promise.all(updatedPages.map(async (page, index) => {
        if (!page.imageUrl) return;

        // If it's NOT a data URL, we assume it's already saved.
        // We skip upload.
        if (!page.imageUrl.startsWith('data:image/')) {
            return;
        }

        // It is a Data URL -> Upload
        try {
            const imageUuid = crypto.randomUUID();

            // Upload to R2
            const result = await uploadProjectImage(projectId, imageUuid, page.imageUrl);
            const storageKey = result.key;

            // Insert into images table
            const { error: dbError } = await supabase.from('images').insert({
                id: imageUuid,
                project_id: projectId,
                storage_path: storageKey,
                type: 'page',
                mime_type: 'image/png', // Assumption
                user_id: (await supabase.auth.getUser()).data.user?.id!,
                generation_prompt: page.prompt,
                metadata: {
                    pageIndex: page.pageIndex,
                    status: page.status,
                    isCover: page.isCover || false
                }
            });

            if (dbError) {
                console.error('Failed to save image metadata:', dbError);
                return;
            }

            // Get a signed URL for specific viewing
            const signedUrl = await getSignedUrl(storageKey);

            if (signedUrl) {
                // Update the page object in our return array
                updatedPages[index] = {
                    ...page,
                    id: imageUuid, // Update ID to match DB
                    imageUrl: signedUrl,
                    isLoading: false
                };
            }

        } catch (err) {
            console.error('Failed to persist image:', err);
        }
    }));

    return updatedPages;
}

/**
 * Delete a project
 */
export async function deleteProject(publicId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error('Not authenticated');
    }

    const { error } = await supabase
        .from('projects')
        .update({ is_archived: true })
        .eq('public_id', publicId)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error deleting project:', error);
        throw error;
    }
}

/**
 * Map database record to frontend SavedProject type
 */
function mapDbToSavedProject(record: ProjectWithColoringData): SavedProject {
    const coloringData = record.coloring_studio_data;

    return {
        id: record.public_id,
        projectName: record.title,
        pageAmount: coloringData?.page_count || 1,
        pageSizeId: 'square', // Default, not stored in DB
        visualStyle: coloringData?.style || 'Bold & Easy',
        complexity: coloringData?.complexity || 'Simple',
        targetAudienceId: coloringData?.audience || 'kids',
        userPrompt: record.description || '',
        hasHeroRef: false,
        heroImage: null,
        includeText: false,
        createdAt: new Date(record.created_at).getTime(),
        updatedAt: new Date(record.updated_at).getTime(),
        thumbnail: record.cover_image_url || undefined,
        pages: [] // Default empty, populated in fetchProject
    };
}
