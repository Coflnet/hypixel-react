import { promises as fs } from 'fs'
import path from 'path'
import { MDXRemote } from 'next-mdx-remote/rsc'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import { notFound } from 'next/navigation'
import matter from 'gray-matter'

const docsDirectory = path.join(process.cwd(), 'app/wiki/docs')

async function getDoc(slug: string) {
    const filePath = path.join(docsDirectory, `${slug}.md`)
    try {
        const fileContent = await fs.readFile(filePath, 'utf8')
        const { content, data } = matter(fileContent)
        return { content, data, slug }
    } catch (error) {
        return null
    }
}

export default async function WikiPage(props) {
    const params = await props.params
    let slug = params.slug
    const doc = await getDoc(slug)

    if (!doc) {
        notFound()
    }

    return (
        <article>
            <h1>{doc.data.title || doc.slug.replace(/-/g, ' ')}</h1>
            <MDXRemote
                source={doc.content}
                options={{
                    mdxOptions: {
                        rehypePlugins: [rehypeSlug, rehypeAutolinkHeadings]
                    }
                }}
            />
        </article>
    )
}

export async function generateStaticParams() {
    const fileNames = await fs.readdir(docsDirectory)
    return fileNames.map(fileName => ({
        slug: fileName.replace(/\.md?$/, '')
    }))
}

export async function generateMetadata(props) {
    const params = await props.params
    const doc = await getDoc(params.slug)
    if (!doc) {
        return {}
    }
    return {
        title: doc.data.title || doc.slug.replace(/-/g, ' '),
        description: doc.data.description || `Learn about ${doc.slug.replace(/-/g, ' ')} on SkyCofl`
    }
}
