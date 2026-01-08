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
    'Mod',
    'The SkyCofl Minecraft Mod',
    undefined,
    undefined,
    undefined,
    getCanonicalUrl('/mod')
)
