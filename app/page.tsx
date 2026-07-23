import StartpageComponent from '../components/Startpage/Startpage'
import Search from '../components/Search/Search'
import { getHeadMetadata, getCanonicalUrl } from '../utils/SSRUtils'
import { Container } from 'react-bootstrap'
import FavoriteItemsBar from '../components/Favorites/FavoriteItemsBar'

export default async function Page() {
    return (
        <>
            <Container>
                <Search />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <div id="skycofl-ai-chat-launcher" />
                </div>
                <FavoriteItemsBar />
                <StartpageComponent />
            </Container>
        </>
    )
}

export const metadata = getHeadMetadata(
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    getCanonicalUrl('/')
)
