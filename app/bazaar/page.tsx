import { getHeadMetadata } from '../../utils/SSRUtils'
import NavBar from '../../components/NavBar/NavBar'
import AuthMod from '../../components/AuthMod/AuthMod'
import { Container } from 'react-bootstrap'
import { initAPI } from '../../api/ApiHelper'
import Bazaar from '../../components/BazaarSpreadFlipList/BazaarSpreadFlipList'

export default async function Page() {
    let api = initAPI(true)
    let flips = await api.getBazaarSpreadFlips()

    return (
        <>
            <Container style={{ height: 'calc(100vh - 40px)' }}>
                <h2>
                    <NavBar />
                    Bazaar
                </h2>
                <Bazaar flips={flips} />
            </Container>
        </>
    )
}

export const metadata = getHeadMetadata('Bazaar Spread Flips')
