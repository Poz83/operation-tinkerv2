/**
 * Projects Service
 * 
 * Handles CRUD operations for projects using Supabase.
 * Maps between frontend SavedProject type and Supabase tables.
 */

import { supabase } from '../lib/supabase';
import type { SavedProject } from '../types';

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

    // Map database records to SavedProject format
    return (data as ProjectWithColoringData[]).map(mapDbToSavedProject);
}

/**
 * Fetch a single project by its public ID
 */
export async function fetchProject(publicId: string): Promise<SavedProject | null> {
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
        .eq('public_id', publicId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            // Not found
            return null;
        }
        console.error('Error fetching project:', error);
        throw error;
    }

    return mapDbToSavedProject(data as ProjectWithColoringData);
}

/**
 * Save a project (create or update)
 */
export async function saveProject(project: SavedProject): Promise<SavedProject> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error('Not authenticated');
    }

    // Check if project exists (by ID)
    const isUpdate = !!project.id && !project.id.startsWith('temp-') && project.id.startsWith('CB');

    let projectId: string;
    let publicId: string;

    if (isUpdate) {
        // Update existing project
        const { data: existingProject, error: fetchError } = await supabase
            .from('projects')
            .select('id, public_id')
            .eq('public_id', project.id)
            .single();

        if (fetchError || !existingProject) {
            // Project doesn't exist, create new
            return createNewProject(user.id, project);
        }

        projectId = (existingProject as { id: string; public_id: string }).id;
        publicId = (existingProject as { id: string; public_id: string }).public_id;

        // Update projects table
        const { error: updateError } = await supabase
            .from('projects')
            .update({
                title: project.projectName,
                description: project.userPrompt,
                cover_image_url: project.thumbnail || null,
                updated_at: new Date().toISOString()
            })
            .eq('id', projectId);

        if (updateError) {
            console.error('Error updating project:', updateError);
            throw updateError;
        }

        // Update coloring_studio_data
        const { error: dataError } = await supabase
            .from('coloring_studio_data')
            .upsert({
                project_id: projectId,
                style: project.visualStyle,
                audience: project.targetAudienceId,
                complexity: project.complexity,
                page_count: project.pageAmount
            });

        if (dataError) {
            console.error('Error updating coloring studio data:', dataError);
            throw dataError;
        }
    } else {
        // Create new project
        return createNewProject(user.id, project);
    }

    // Return updated project
    return {
        ...project,
        id: publicId,
        updatedAt: Date.now()
    };
}

/**
 * Create a new project
 */
async function createNewProject(userId: string, project: SavedProject): Promise<SavedProject> {
    const publicId = generatePublicId();

    // Insert into projects table
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

    if (insertError || !newProject) {
        console.error('Error creating project:', insertError);
        throw insertError || new Error('Failed to create project');
    }

    const projectRecord = newProject as { id: string; public_id: string; created_at: string; updated_at: string };

    // Insert coloring_studio_data
    const { error: dataError } = await supabase
        .from('coloring_studio_data')
        .insert({
            project_id: projectRecord.id,
            style: project.visualStyle,
            audience: project.targetAudienceId,
            complexity: project.complexity,
            page_count: project.pageAmount
        });

    if (dataError) {
        console.error('Error creating coloring studio data:', dataError);
        // Clean up the project if coloring data fails
        await supabase.from('projects').delete().eq('id', projectRecord.id);
        throw dataError;
    }

    return {
        ...project,
        id: projectRecord.public_id,
        createdAt: new Date(projectRecord.created_at).getTime(),
        updatedAt: new Date(projectRecord.updated_at).getTime()
    };
}

/**
 * Delete a project
 */
export async function deleteProject(publicId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error('Not authenticated');
    }

    // Soft delete by setting is_archived = true
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
        hasHeroRef: false, // Not stored in DB
        heroImage: null, // Not stored in DB (would be in images table)
        includeText: false, // Not stored in DB
        createdAt: new Date(record.created_at).getTime(),
        updatedAt: new Date(record.updated_at).getTime(),
        thumbnail: record.cover_image_url || undefined
    };
}
