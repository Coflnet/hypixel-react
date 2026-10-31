import Link from 'next/link'
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
                <FavoriteItemsBar />
                <p className="mt-3"><Link href="/guides/tracking-profits-automatically">Hypixel SkyBlock profit tracker</Link>: review completed auction flips and check your costs against sale proceeds.</p>
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
