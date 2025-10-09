import { getHeadMetadata } from '../../utils/SSRUtils'
import NavBar from '../../components/NavBar/NavBar'
import AuthMod from '../../components/AuthMod/AuthMod'
import { Container } from 'react-bootstrap'

export default async function Page() {
    return (
        <>
            <Container>
                <h2>
                    <NavBar />
                    Authorize Mod
                </h2>
                <hr />
                <AuthMod />
            </Container>
        </>
    )
}

export const metadata = getHeadMetadata(
    'Authenticate Mod',
    'Connect your Minecraft account with our SkyCofl mod for Hypixel SkyBlock. Sync your data, enable premium features, and get real-time flipping notifications directly in-game.'
)
