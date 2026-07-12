import { getHeadMetadata, getCanonicalUrl } from '../../utils/SSRUtils'
import NavBar from '../../components/NavBar/NavBar'
import { Container } from 'react-bootstrap'
import LowballOverview from '../../components/LowballOverview/LowballOverview'

export default async function Page() {
    return (
        <>
            <Container>
                <h2>
                    <NavBar />
                    <span>Lowball Offers</span>
                </h2>
                <LowballOverview />
            </Container>
        </>
    )
}

export const metadata = getHeadMetadata(
    'Lowball Offers',
    'Browse and manage Hypixel SkyBlock lowball offers. Load your own offers after signing in, or inspect public offers by item tag.',
    undefined,
    undefined,
    undefined,
    getCanonicalUrl('/trade')
)
