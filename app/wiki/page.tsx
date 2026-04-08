import { promises as fs } from 'fs'
import path from 'path'
import { MDXRemote } from 'next-mdx-remote/rsc'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import remarkGfm from 'remark-gfm'
import matter from 'gray-matter'
import { getHeadMetadata, getCanonicalUrl } from '../../utils/SSRUtils'
import TimezoneDetect from '../../components/TimezoneDetect/TimezoneDetect'

const docsDirectory = path.join(process.cwd(), 'app/wiki/docs')

async function getIndexDoc() {
    const filePath = path.join(docsDirectory, `index.md`)
    try {
        const fileContent = await fs.readFile(filePath, 'utf8')
        const { content, data } = matter(fileContent)
        return { content, data }
    } catch (error) {
        // It's okay if the index page doesn't exist
        return null
    }
}

export default async function Wiki() {
    const doc = await getIndexDoc()

    if (!doc) {
        return <div>Select a page to get started</div>
    }

    return (
        <article>
            <h1>{doc.data.title || 'Welcome to the Wiki'}</h1>
            <MDXRemote
                source={doc.content}
                options={{
                    mdxOptions: {
                        remarkPlugins: [remarkGfm],
                        rehypePlugins: [rehypeSlug, rehypeAutolinkHeadings]
                    }
                }}
                components={{ TimezoneDetect }}
            />
        </article>
    )
}

export const metadata = getHeadMetadata(
    'Wiki',
    'Comprehensive guides and documentation for Hypixel SkyBlock tools, trading strategies, mod features, and optimization tips. Learn how to maximize your profits and improve your gameplay.',
    undefined,
    undefined,
    undefined,
    getCanonicalUrl('/wiki')
)
