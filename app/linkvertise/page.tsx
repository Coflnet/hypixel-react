import { Container } from 'react-bootstrap'
import NavBar from '../../components/NavBar/NavBar'
import { getHeadMetadata } from '../../utils/SSRUtils'
import Linkvertise from '../../components/Linkvertise/Linkvertise'

export default async function Page() {
    return (
        <>
            <Container>
                <h2>
                    <NavBar />
                    Linkvertise
                </h2>
                <Linkvertise />
            </Container>
        </>
    )
}

export const metadata = getHeadMetadata('Linkvertise', 'Get Starter Premium for free')
