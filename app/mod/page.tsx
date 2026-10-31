import { Container } from 'react-bootstrap'
import ModDetails from '../../components/ModDetails/ModDetails'
import NavBar from '../../components/NavBar/NavBar'
import RatChecker from '../../components/RatChecker/RatChecker'
import { getHeadMetadata, getCanonicalUrl } from '../../utils/SSRUtils'

export default function Mod() {
    return (
        <>
            <Container>
                <NavBar />
                <ModDetails />
                <RatChecker />
            </Container>
        </>
    )
}

export const metadata = getHeadMetadata(
    'Hypixel SkyBlock Flipping Mod for Beginners | SkyCofl',
    'Download SkyCofl through Modrinth, set up your first manual auction flip, compare free and paid access, and track completed flips.',
    undefined,
    undefined,
    undefined,
    getCanonicalUrl('/mod')
)
