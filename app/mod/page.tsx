import { Container } from 'react-bootstrap'
import ModDetails from '../../components/ModDetails/ModDetails'
import NavBar from '../../components/NavBar/NavBar'
import RatChecker from '../../components/RatChecker/RatChecker'
import { getHeadMetadata } from '../../utils/SSRUtils'

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

export const metadata = getHeadMetadata('Mod', 'The Coflnet Minecraft Mod')
