import { Container } from 'react-bootstrap'
import NavBar from '../../../components/NavBar/NavBar'
import { getHeadMetadata } from '../../../utils/SSRUtils'

export default async function Page() {
    return (
        <>
            <Container>
                <h2>
                    <NavBar />
                    Linkvertise task successful
                </h2>
                <hr />
                <p>You successfully completed the Linkvertise task. You can close this page now.</p>
            </Container>
        </>
    )
}

export const metadata = getHeadMetadata('Linkvertise', 'Linkvertise task successful')
