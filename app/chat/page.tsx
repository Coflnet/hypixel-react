import { Container } from 'react-bootstrap'
import { AiChat } from '../../components/AiChat/AiChat'
import NavBar from '../../components/NavBar/NavBar'
import { getCanonicalUrl, getHeadMetadata } from '../../utils/SSRUtils'

export default function Page() {
    return (
        <Container>
            <h2>
                <NavBar />
                AI Chat
            </h2>
            <AiChat fullPage />
        </Container>
    )
}

export const metadata = getHeadMetadata(
    'AI Chat',
    'Ask the SkyCofl assistant about features, filters, guides, API endpoints, and current SkyBlock item prices.',
    undefined,
    undefined,
    undefined,
    getCanonicalUrl('/chat')
)
