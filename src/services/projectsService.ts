/**
 * Projects Service
 * 
 * Handles CRUD operations for projects using Supabase.
 * Maps between frontend SavedProject type and Supabase tables.
 */

import { supabase } from '../lib/supabase';
import type { SavedProject, ColoringPage } from '../types';
import { uploadProjectImage, getSignedUrl, getSignedUrls } from './storageService';
import { cacheProject, getCachedProject, cacheProjectList, getCachedProjectList, deleteCachedProject } from './offlineStore';

/**
 * Helper to remove invalid URLs (blob:) from project before caching.
 * Blob URLs are session-specific and cause errors if loaded in a new session.
 */
function sanitizeForCache(project: SavedProject): SavedProject {
    const p = { ...project };

    // 1. Sanitize Thumbnail
    if (p.thumbnail && p.thumbnail.startsWith('blob:')) {
        p.thumbnail = undefined;
    }

    // 2. Sanitize Pages
    if (p.pages) {
        p.pages = p.pages.map(page => {
            if (page.imageUrl && page.imageUrl.startsWith('blob:')) {
                return { ...page, imageUrl: '' }; // Clear invalid URL
            }
            return page;
        });
    }

    // 3. Sanitize Hero Images
    if (p.heroImage && (p.heroImage as any).base64 && (p.heroImage as any).base64.startsWith('blob:')) {
        // base64 field shouldn't have blob, but checking just in case of misuse
        // actually heroImage is usually { base64: string, mimeType: string } 
        // so real base64 is fine.
    }

    // 4. Sanitize Hero Lab specific fields
    const anyP = p as any;
    if (anyP.baseImageUrl && anyP.baseImageUrl.startsWith('blob:')) anyP.baseImageUrl = undefined;
    if (anyP.referenceImageUrl && anyP.referenceImageUrl.startsWith('blob:')) anyP.referenceImageUrl = undefined;
    if (anyP.profileSheetUrl && anyP.profileSheetUrl.startsWith('blob:')) anyP.profileSheetUrl = undefined;

    return p;
}

// Type for the joined query result
interface ProjectWithColoringData {
    id: string;
    public_id: string;
    title: string;
    description: string | null;
    cover_image_url: string | null;
    user_id: string | null;
    visibility: string;
    created_at: string;
    updated_at: string;
    tool_type: string;
    coloring_studio_data: {
        style: string | null;
        audience: string | null;
        complexity: string | null;
        page_count: number | null;
    } | {
        style: string | null;
        audience: string | null;
        complexity: string | null;
        page_count: number | null;
    }[] | null;
    hero_lab_data: {
        dna: any;
        base_image_url: string | null;
        seed: number | null;
    } | {
        dna: any;
        base_image_url: string | null;
        seed: number | null;
    }[] | null;
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
 * Generate a public ID for a project (e.g., CB847291 for coloring, HL847291 for hero lab)
 */
function generatePublicId(toolType?: string): string {
    const prefix = toolType === 'hero_lab' ? 'HL' : 'CB';
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    return `${prefix}${randomNum}`;
}

/**
 * Fetch all projects for the current user
 * Strategies:
 * - 'network-only': Default behavior (current)
 * - 'cache-first': Returns cache if available, then updates in background (requires UI handling of promise/callback, simplified here to just return cache if present for speed, trusting swr hooks or manual refresh)
 * - 'stale-while-revalidate': (Not fully implemented in this simple promise return, but mimicking cache-first)
 */
export async function fetchUserProjects(strategy: 'network-only' | 'cache-first' = 'network-only'): Promise<SavedProject[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.warn('No authenticated user');
        return [];
    }

    // 1. Try Cache
    if (strategy === 'cache-first') {
        const cached = await getCachedProjectList('user_projects');
        if (cached && cached.length > 0) {
            // Trigger background update? 
            // For now, simpler: if we have cache, return it. 
            // Caller is responsible for triggering a refresh if needed, 
            // or we could fire a promise that resolves later... but that's complex without observables.
            // Let's do: Return cache, but ALSO fire the network request to update cache for NEXT time.
            fetchUserProjectsNetwork(user.id).catch(console.error);
            return cached;
        }
    }

    return fetchUserProjectsNetwork(user.id);
}

/**
 * Internal network fetch for projects
 */
async function fetchUserProjectsNetwork(userId: string): Promise<SavedProject[]> {
    const { data, error } = await supabase
        .from('projects')
        .select(`
            id,
            public_id,
            title,
            description,
            cover_image_url,
            user_id,
            visibility,
            created_at,
            updated_at,
            tool_type
        `)
        .eq('user_id', userId)
        .in('tool_type', ['coloring_studio', 'hero_lab'])
        .eq('is_archived', false)
        .order('updated_at', { ascending: false });

    if (error) {
        console.error('Error fetching projects:', error);
        throw error;
    }

    // Map without pages (list view doesn't need full pages)
    const projects = (data as unknown as ProjectWithColoringData[]).map(r => mapDbToSavedProject(r));

    // Update Cache (Sanitized)
    const sanitizedProjects = projects.map(p => sanitizeForCache(p));
    await cacheProjectList('user_projects', sanitizedProjects);

    return projects;
}

/**
 * Fetch a single project by its public ID
 * Now also fetches and signs image URLs
 */
export async function fetchProject(publicId: string, strategy: 'network-only' | 'cache-first' = 'network-only'): Promise<SavedProject | null> {

    // 1. Try Cache
    if (strategy === 'cache-first') {
        const cached = await getCachedProject(publicId);
        if (cached) {
            // Background revalidate
            fetchProjectNetwork(publicId).catch(console.error);
            return cached;
        }
    }

    return fetchProjectNetwork(publicId);
}

/**
 * Internal network fetch for single project
 */
async function fetchProjectNetwork(publicId: string): Promise<SavedProject | null> {
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
            visibility,
            created_at,
            updated_at,
            tool_type,
            coloring_studio_data (
                style,
                audience,
                complexity,
                page_count
            ),
            hero_lab_data (
                dna,
                base_image_url,
                seed
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
        .eq('project_id', (projectData as unknown as ProjectWithColoringData).id)
        .eq('type', 'page');

    if (imagesError) {
        console.error('Error fetching project images:', imagesError);
        // Fallback: return project without pages
        return mapDbToSavedProject(projectData as unknown as ProjectWithColoringData);
    }

    // 3. Convert DB Images to ColoringPages & Get Signed URLs (Batch)
    const allImageKeys = (imagesData as DbImage[]).map(img => img.storage_path);
    const signedUrlsMap = await getSignedUrls(allImageKeys);

    const pages: ColoringPage[] = (imagesData as DbImage[]).map((img) => {
        const signedUrl = signedUrlsMap[img.storage_path] || '';

        return {
            id: img.id,
            imageUrl: signedUrl,
            prompt: img.generation_prompt || '',
            // Restore metadata
            pageIndex: img.metadata?.pageIndex ?? 0,
            status: img.metadata?.status ?? 'complete',
            isLoading: false,
            isCover: img.metadata?.isCover ?? false,
            qa: img.metadata?.qa
        };
    });

    // Sort by pageIndex
    pages.sort((a, b) => (a.pageIndex ?? 0) - (b.pageIndex ?? 0));

    // 4. Combine and return
    const project = mapDbToSavedProject(projectData as unknown as ProjectWithColoringData);
    project.pages = pages;

    // Hydrate Hero Logic: If we have a base_image_url that looks like a key (no http), sign it
    if ((project as any).toolType === 'hero_lab' && (project as any).baseImageUrl) {
        const urlOrKey = (project as any).baseImageUrl;
        if (urlOrKey && !urlOrKey.startsWith('http') && !urlOrKey.startsWith('data:')) {
            // Assume it's a key
            const signed = await getSignedUrl(urlOrKey);
            if (signed) {
                (project as any).baseImageUrl = signed;
            }
        }
    }

    // Update Cache
    await cacheProject(sanitizeForCache(project));

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

    // Check if project exists (by ID) - Valid IDs start with 'CB' (coloring) or 'HL' (hero lab)
    const isValidPublicId = project.id && !project.id.startsWith('temp-') &&
        (project.id.startsWith('CB') || project.id.startsWith('HL'));
    const isUpdate = !!isValidPublicId;

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
                    visibility: project.visibility || 'private',
                    updated_at: new Date().toISOString()
                })
                .eq('id', projectId);

            // Update appropriate auxiliary table based on tool type
            const toolType = project.toolType || ((project as any).dna ? 'hero_lab' : 'coloring_studio');

            if (toolType === 'hero_lab') {
                const { error: heroError } = await supabase
                    .from('hero_lab_data')
                    .upsert({
                        project_id: projectId,
                        dna: (project as any).dna || {},
                        base_image_url: (project as any).baseImageUrl,
                        reference_image_url: (project as any).referenceImageUrl,
                        profile_sheet_url: (project as any).profileSheetUrl,
                        seed: (project as any).seed
                    });
                if (heroError) console.error('Hero data upsert error:', heroError);
            } else {
                const { error: coloringError } = await supabase
                    .from('coloring_studio_data')
                    .upsert({
                        project_id: projectId,
                        style: project.visualStyle,
                        audience: project.targetAudienceId,
                        complexity: project.complexity,
                        page_count: project.pageAmount
                    });
                if (coloringError) console.error('Coloring data upsert error:', coloringError);
            }
        }

    } else {
        // Create new project
        const result = await createNewProjectDbOnly(user.id, project);
        projectId = result.id;
        publicId = result.public_id;
    }

    // Handle Hero Lab Image Uploads (Base64 -> R2)
    if ((project as any).toolType === 'hero_lab') {
        const p = project as any;
        const updates: any = {};

        // Helper to process image upload
        const processHeroImage = async (dataUrl: string | undefined, type: 'hero_base' | 'reference' | 'profile_sheet') => {
            if (dataUrl && dataUrl.startsWith('data:image/')) {
                try {
                    const imageUuid = crypto.randomUUID();
                    const result = await uploadProjectImage(projectId, imageUuid, dataUrl);

                    // Track in images table
                    await supabase.from('images').insert({
                        id: imageUuid,
                        project_id: projectId,
                        storage_path: result.key,
                        type: type,
                        mime_type: 'image/png', // Assumption
                        user_id: user.id
                    });

                    return result.key;
                } catch (err) {
                    console.error(`Failed to upload ${type}:`, err);
                    return dataUrl; // Keep original on failure
                }
            }
            return dataUrl; // Return as-is if not a data URL (already a key or undefined)
        };

        // 1. Base Image
        const newBaseKey = await processHeroImage(p.baseImageUrl, 'hero_base');
        if (newBaseKey && newBaseKey !== p.baseImageUrl) {
            updates.base_image_url = newBaseKey;
        }

        // 2. Reference Image (Uploaded by user)
        const newRefKey = await processHeroImage(p.referenceImageUrl, 'reference');
        if (newRefKey && newRefKey !== p.referenceImageUrl) {
            updates.reference_image_url = newRefKey;
        }

        // 3. Profile Sheet
        const newProfileKey = await processHeroImage(p.profileSheetUrl, 'profile_sheet');
        if (newProfileKey && newProfileKey !== p.profileSheetUrl) {
            updates.profile_sheet_url = newProfileKey;
        }

        // Update DB if we have new keys
        if (Object.keys(updates).length > 0) {
            await supabase
                .from('hero_lab_data')
                .update(updates)
                .eq('project_id', projectId);
        }
    }

    // Handle Image Uploads & Persistence
    let updatedPages = project.pages || [];
    if (updatedPages.length > 0) {
        updatedPages = await persistProjectImages(projectId, updatedPages);
    }

    // Return updated project
    // Return updated project
    const finalProject = {
        ...project,
        id: publicId,
        pages: updatedPages,
        updatedAt: Date.now()
    };

    // Update Cache
    await cacheProject(sanitizeForCache(finalProject));

    return finalProject;
}

/**
 * Internal helper to create DB records for a new project
 */
async function createNewProjectDbOnly(userId: string, project: SavedProject) {
    const toolType = (project as any).toolType || 'coloring_studio';
    const publicId = generatePublicId(toolType);

    const { data: newProject, error: insertError } = await supabase
        .from('projects')
        .insert({
            public_id: publicId,
            tool_type: (project as any).toolType || 'coloring_studio',
            user_id: userId,
            title: project.projectName || 'Untitled Project',
            description: project.userPrompt,
            cover_image_url: project.thumbnail || null
        })
        .select('id, public_id, created_at, updated_at')
        .single();

    if (insertError || !newProject) throw insertError || new Error('Failed to create project');

    if (insertError || !newProject) throw insertError || new Error('Failed to create project');

    if (project.toolType === 'hero_lab' || (project as any).dna) {
        await supabase
            .from('hero_lab_data')
            .insert({
                project_id: newProject.id,
                dna: (project as any).dna || {},
                base_image_url: (project as any).baseImageUrl,
                seed: (project as any).seed
            });
    } else {
        // Default to coloring studio if not specified or regular
        await supabase
            .from('coloring_studio_data')
            .insert({
                project_id: newProject.id,
                style: project.visualStyle,
                audience: project.targetAudienceId,
                complexity: project.complexity,
                page_count: project.pageAmount
            });
    }

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
                    isCover: page.isCover || false,
                    qa: page.qa as any
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

    // Remove from cache
    await deleteCachedProject(publicId);
}

export interface ReferenceImage {
    id: string;
    url: string;
    projectId: string;
    createdAt: string;
    type: 'hero_base' | 'reference' | 'uploaded';
}

/**
 * Fetch all reference images (hero bases, uploads) for the user
 */
export async function fetchUserReferences(): Promise<ReferenceImage[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Fetch images where type is 'hero_base' or 'reference'
    const { data, error } = await supabase
        .from('images')
        .select(`
            id,
            storage_path,
            project_id,
            created_at,
            type
        `)
        .eq('user_id', user.id)
        .in('type', ['hero_base', 'reference']);

    if (error) {
        console.error('Error fetching references:', error);
        return [];
    }

    // Sign URLs
    // Sign URLs (Batch)
    const allRefKeys = data.map(img => img.storage_path);
    const signedUrlsMap = await getSignedUrls(allRefKeys);

    const references: ReferenceImage[] = data.map((img) => {
        const signedUrl = signedUrlsMap[img.storage_path] || '';
        return {
            id: img.id,
            url: signedUrl,
            projectId: img.project_id,
            createdAt: img.created_at,
            type: img.type as any
        };
    });

    // Sort by recent
    return references.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Delete a reference image
 */
export async function deleteReference(id: string): Promise<void> {
    const { error } = await supabase
        .from('images')
        .delete()
        .eq('id', id);

    if (error) throw error;
    // Note: R2 file cleanup could be handled by a trigger or separate job, 
    // or we could add specific R2 delete logic here if needed.
    // For now, removing the DB record effectively hides it.
}

/**
 * Map database record to frontend SavedProject type
 */
function mapDbToSavedProject(record: any): SavedProject {
    // Safely unwrap joined data (Supabase might return array or object)
    const unwrap = (data: any) => Array.isArray(data) ? data[0] : data;

    const coloringData = unwrap(record.coloring_studio_data);
    const heroData = unwrap(record.hero_lab_data);

    const baseProject = {
        id: record.public_id,
        projectName: record.title,
        userPrompt: record.description || '',
        createdAt: new Date(record.created_at).getTime(),
        updatedAt: new Date(record.updated_at).getTime(),
        thumbnail: record.cover_image_url || undefined,
        pages: [],
        visibility: (record.visibility as 'private' | 'unlisted' | 'public') || 'private',
        toolType: record.tool_type || 'coloring_studio'
    };

    if (record.tool_type === 'hero_lab' && heroData) {
        return {
            ...baseProject,
            pageAmount: 1,
            pageSizeId: 'portrait',
            visualStyle: heroData.dna?.styleLock || 'Bold & Easy',
            complexity: 'Moderate', // Default for now
            targetAudienceId: 'kids',
            hasHeroRef: false,
            heroImage: null,
            includeText: false,
            // Hero Specifics (merged into type)
            ...{
                dna: heroData.dna || {},
                baseImageUrl: heroData.base_image_url,
                seed: heroData.seed
            }
        } as unknown as SavedProject; // Using unknown to bypass strict type checking for now
    }

    return {
        ...baseProject,
        pageAmount: coloringData?.page_count || 1,
        pageSizeId: 'square',
        visualStyle: coloringData?.style || 'Bold & Easy',
        complexity: coloringData?.complexity || 'Simple',
        targetAudienceId: coloringData?.audience || 'kids',
        hasHeroRef: false,
        heroImage: null,
        includeText: false,
    };
}
