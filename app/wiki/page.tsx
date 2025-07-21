import { Container } from 'react-bootstrap'
import { getAllWikiPages } from '../../utils/WikiUtils'
import { getHeadMetadata } from '../../utils/SSRUtils'
import WikiContent from '../../components/Wiki/WikiContent'
import { notFound } from 'next/navigation'

export default async function WikiHomePage() {
    const pages = await getAllWikiPages()
    const homePage = pages.find(page => page.slug === 'index')
    
    if (!homePage) {
        notFound()
    }

    return (
        <Container>
            <WikiContent page={homePage} allPages={pages} />
        </Container>
    )
}

export const metadata = getHeadMetadata(
    'Wiki | Coflnet Documentation',
    'Comprehensive guide to Coflnet features and Hypixel SkyBlock tools',
    undefined,
    ['wiki', 'documentation', 'guide', 'tutorial']
)