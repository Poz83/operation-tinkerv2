/**
 * Gallery Service
 * 
 * Fetches public gallery images from all users' public projects.
 */

import { supabase } from '../lib/supabase';
import { getSignedUrl } from './storageService';

// Type for gallery image with project/creator info
export interface GalleryImage {
    id: string;
    imageUrl: string;
    storagePath: string;
    prompt: string | null;
    createdAt: string;
    projectId: string;
    projectTitle: string;
    style: string | null;
    audience: string | null;
    complexity: string | null;
    creatorName: string | null;
    creatorAvatar: string | null;
}

export interface GalleryFilters {
    style?: string;
    audience?: string;
    complexity?: string;
    search?: string;
}

export interface GalleryResult {
    images: GalleryImage[];
    hasMore: boolean;
    total: number;
}

/**
 * Fetch public gallery images with pagination and filters
 */
export async function fetchPublicGalleryImages(
    page: number = 1,
    limit: number = 24,
    filters: GalleryFilters = {}
): Promise<GalleryResult> {
    try {
        const offset = (page - 1) * limit;

        // Build query with joins
        let query = supabase
            .from('images')
            .select(`
                id,
                storage_path,
                generation_prompt,
                created_at,
                project_id,
                projects!inner (
                    id,
                    title,
                    visibility,
                    user_id,
                    users (
                        display_name,
                        avatar_url
                    ),
                    coloring_studio_data (
                        style,
                        audience,
                        complexity
                    )
                )
            `, { count: 'exact' })
            .eq('projects.visibility', 'public')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        // Apply filters
        if (filters.style) {
            query = query.eq('projects.coloring_studio_data.style', filters.style);
        }
        if (filters.audience) {
            query = query.eq('projects.coloring_studio_data.audience', filters.audience);
        }
        if (filters.complexity) {
            query = query.eq('projects.coloring_studio_data.complexity', filters.complexity);
        }
        if (filters.search) {
            query = query.or(`generation_prompt.ilike.%${filters.search}%,projects.title.ilike.%${filters.search}%`);
        }

        const { data, error, count } = await query;

        if (error) {
            console.error('Error fetching gallery images:', error);
            return { images: [], hasMore: false, total: 0 };
        }

        if (!data || data.length === 0) {
            return { images: [], hasMore: false, total: count || 0 };
        }

        // Map to GalleryImage and get signed URLs
        const images: GalleryImage[] = await Promise.all(
            data.map(async (img: any) => {
                const project = img.projects;
                const user = project?.users;
                const coloringData = project?.coloring_studio_data;

                // Get signed URL for the image
                const imageUrl = await getSignedUrl(img.storage_path);

                return {
                    id: img.id,
                    imageUrl,
                    storagePath: img.storage_path,
                    prompt: img.generation_prompt,
                    createdAt: img.created_at,
                    projectId: project?.id || img.project_id,
                    projectTitle: project?.title || 'Untitled',
                    style: coloringData?.style || null,
                    audience: coloringData?.audience || null,
                    complexity: coloringData?.complexity || null,
                    creatorName: user?.display_name || null,
                    creatorAvatar: user?.avatar_url || null,
                };
            })
        );

        return {
            images,
            hasMore: (count || 0) > offset + limit,
            total: count || 0,
        };
    } catch (error) {
        console.error('Failed to fetch gallery images:', error);
        return { images: [], hasMore: false, total: 0 };
    }
}

/**
 * Fetch a single public image by ID
 */
export async function fetchPublicImage(imageId: string): Promise<GalleryImage | null> {
    try {
        const { data, error } = await supabase
            .from('images')
            .select(`
                id,
                storage_path,
                generation_prompt,
                created_at,
                project_id,
                projects!inner (
                    id,
                    title,
                    visibility,
                    user_id,
                    users (
                        display_name,
                        avatar_url
                    ),
                    coloring_studio_data (
                        style,
                        audience,
                        complexity
                    )
                )
            `)
            .eq('id', imageId)
            .eq('projects.visibility', 'public')
            .single();

        if (error || !data) {
            return null;
        }

        const project = (data as any).projects;
        const user = project?.users;
        const coloringData = project?.coloring_studio_data;
        const imageUrl = await getSignedUrl(data.storage_path);

        return {
            id: data.id,
            imageUrl,
            storagePath: data.storage_path,
            prompt: data.generation_prompt,
            createdAt: data.created_at,
            projectId: project?.id || data.project_id,
            projectTitle: project?.title || 'Untitled',
            style: coloringData?.style || null,
            audience: coloringData?.audience || null,
            complexity: coloringData?.complexity || null,
            creatorName: user?.display_name || null,
            creatorAvatar: user?.avatar_url || null,
        };
    } catch (error) {
        console.error('Failed to fetch public image:', error);
        return null;
    }
}
