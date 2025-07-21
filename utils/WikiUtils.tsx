import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import remarkHtml from 'remark-html'
import remarkGfm from 'remark-gfm'

const wikiDirectory = path.join(process.cwd(), 'wiki')

export interface WikiPage {
    slug: string
    title: string
    description: string
    order: number
    content: string
    htmlContent: string
}

export async function getAllWikiPages(): Promise<WikiPage[]> {
    if (!fs.existsSync(wikiDirectory)) {
        return []
    }

    const fileNames = fs.readdirSync(wikiDirectory)
    const allPages = await Promise.all(
        fileNames
            .filter(fileName => fileName.endsWith('.md'))
            .map(async fileName => {
                const slug = fileName.replace(/\.md$/, '')
                return await getWikiPageBySlug(slug)
            })
    )

    return allPages
        .filter(page => page !== null)
        .sort((a, b) => (a!.order || 999) - (b!.order || 999)) as WikiPage[]
}

export async function getWikiPageBySlug(slug: string): Promise<WikiPage | null> {
    try {
        const fullPath = path.join(wikiDirectory, `${slug}.md`)
        
        if (!fs.existsSync(fullPath)) {
            return null
        }

        const fileContents = fs.readFileSync(fullPath, 'utf8')
        const { data, content } = matter(fileContents)

        // Process markdown to HTML
        const processedContent = await remark()
            .use(remarkGfm)
            .use(remarkHtml, { sanitize: false })
            .process(content)

        const htmlContent = processedContent.toString()

        return {
            slug,
            title: data.title || slug,
            description: data.description || '',
            order: data.order || 999,
            content,
            htmlContent
        }
    } catch (error) {
        console.error(`Error reading wiki page ${slug}:`, error)
        return null
    }
}

export function getWikiNavigation(pages: WikiPage[]) {
    return pages.map(page => ({
        slug: page.slug,
        title: page.title,
        order: page.order
    }))
}