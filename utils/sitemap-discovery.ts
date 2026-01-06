import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

/**
 * Utility to dynamically discover guides and wiki pages for sitemap generation
 */

export interface GuideInfo {
    slug: string;
    title?: string;
    description?: string;
}

export interface WikiDocInfo {
    slug: string;
    title?: string;
    description?: string;
}

/**
 * Get all guide pages by scanning the app/guides directory
 * @returns Array of guide slugs
 */
export async function getGuidePages(): Promise<GuideInfo[]> {
    try {
        const guidesDir = path.join(process.cwd(), 'app/guides');
        
        if (!fs.existsSync(guidesDir)) {
            console.warn('Guides directory not found:', guidesDir);
            return [];
        }

        const entries = fs.readdirSync(guidesDir, { withFileTypes: true });
        const guides: GuideInfo[] = [];

        for (const entry of entries) {
            // Skip non-directories and special files
            if (!entry.isDirectory()) {
                continue;
            }

            const slug = entry.name;
            const pagePath = path.join(guidesDir, slug, 'page.tsx');
            
            // Check if page.tsx exists
            if (fs.existsSync(pagePath)) {
                try {
                    // Try to extract metadata from the page file
                    const content = fs.readFileSync(pagePath, 'utf8');
                    
                    // Extract title and description from getHeadMetadata call if present
                    const titleMatch = content.match(/getHeadMetadata\s*\(\s*["'`]([^"'`]+)["'`]/);
                    const descMatch = content.match(/getHeadMetadata\s*\([^,]+,\s*["'`]([^"'`]+)["'`]/);
                    
                    guides.push({
                        slug,
                        title: titleMatch ? titleMatch[1] : undefined,
                        description: descMatch ? descMatch[1] : undefined
                    });
                } catch (error) {
                    console.warn(`Could not read metadata for guide: ${slug}`, error);
                    guides.push({ slug });
                }
            }
        }

        return guides;
    } catch (error) {
        console.error('Error getting guide pages:', error);
        return [];
    }
}

/**
 * Get all wiki documentation pages by scanning the app/wiki/docs directory
 * @returns Array of wiki doc info with slugs and metadata
 */
export async function getWikiDocs(): Promise<WikiDocInfo[]> {
    try {
        const docsDir = path.join(process.cwd(), 'app/wiki/docs');
        
        if (!fs.existsSync(docsDir)) {
            console.warn('Wiki docs directory not found:', docsDir);
            return [];
        }

        const fileNames = fs.readdirSync(docsDir);
        const docs: WikiDocInfo[] = [];

        for (const fileName of fileNames) {
            // Only process .md and .mdx files
            if (!fileName.endsWith('.md') && !fileName.endsWith('.mdx')) {
                continue;
            }

            const slug = fileName.replace(/\.mdx?$/, '');
            const fullPath = path.join(docsDir, fileName);
            
            try {
                const fileContents = fs.readFileSync(fullPath, 'utf8');
                const { data } = matter(fileContents);
                
                // Special handling for index.md
                const docSlug = slug === 'index' ? '' : slug;
                
                docs.push({
                    slug: docSlug,
                    title: data.title as string | undefined,
                    description: data.description as string | undefined
                });
            } catch (error) {
                console.warn(`Could not read wiki doc: ${fileName}`, error);
                docs.push({ slug: slug === 'index' ? '' : slug });
            }
        }

        return docs;
    } catch (error) {
        console.error('Error getting wiki docs:', error);
        return [];
    }
}

/**
 * Generate sitemap entries for all guides
 * @param changefreq Default change frequency for guides
 * @param priority Default priority for guides
 */
export async function generateGuideSitemapEntries(
    changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never' = 'monthly',
    priority: number = 0.7
) {
    const guides = await getGuidePages();
    const today = new Date();
    
    return guides.map(guide => ({
        url: `/guides/${guide.slug}`,
        lastModified: today,
        changeFrequency: changefreq,
        priority: priority
    }));
}

/**
 * Generate sitemap entries for all wiki docs
 * @param changefreq Default change frequency for wiki docs
 * @param priority Default priority for wiki docs
 */
export async function generateWikiSitemapEntries(
    changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never' = 'monthly',
    priority: number = 0.6
) {
    const docs = await getWikiDocs();
    const today = new Date();
    
    return docs.map(doc => {
        const url = doc.slug ? `/wiki/docs/${doc.slug}` : '/wiki';
        return {
            url,
            lastModified: today,
            changeFrequency: changefreq,
            priority: priority
        };
    });
}
