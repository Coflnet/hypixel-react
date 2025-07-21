import { Container } from 'react-bootstrap'
import { getAllWikiPages, getWikiPageBySlug } from '../../../utils/WikiUtils'
import { getHeadMetadata } from '../../../utils/SSRUtils'
import WikiContent from '../../../components/Wiki/WikiContent'
import { notFound } from 'next/navigation'

interface Props {
    params: Promise<{ slug: string }>
}

export default async function WikiPage(props: Props) {
    const params = await props.params
    const [page, allPages] = await Promise.all([
        getWikiPageBySlug(params.slug),
        getAllWikiPages()
    ])
    
    if (!page) {
        notFound()
    }

    return (
        <Container>
            <WikiContent page={page} allPages={allPages} />
        </Container>
    )
}

export async function generateStaticParams() {
    const pages = await getAllWikiPages()
    return pages.map(page => ({
        slug: page.slug
    }))
}

export async function generateMetadata(props: Props) {
    const params = await props.params
    const page = await getWikiPageBySlug(params.slug)
    
    if (!page) {
        return {}
    }

    return getHeadMetadata(
        `${page.title} | Wiki`,
        page.description || `Learn about ${page.title} on Coflnet`,
        undefined,
        ['wiki', 'documentation', page.title.toLowerCase()],
        `${page.title} | Coflnet Wiki`
    )
}