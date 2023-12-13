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

export const metadata = getHeadMetadata('Authenticate Mod')