import StartpageComponent from '../components/Startpage/Startpage'
import Search from '../components/Search/Search'
import { getHeadMetadata, getCanonicalUrl } from '../utils/SSRUtils'
import { Container } from 'react-bootstrap'
import FavoriteItemsBar from '../components/Favorites/FavoriteItemsBar'
import { getLikelyPromotion } from '../utils/PromotionHint'

export default async function Page() {
    const likelyPromotion = await getLikelyPromotion()
    return (
        <>
            <Container>
                <Search />
                <FavoriteItemsBar />
                <StartpageComponent likelyPromotion={likelyPromotion} />
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
