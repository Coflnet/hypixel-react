import { Container } from 'react-bootstrap'
import { initAPI } from '../../api/ApiHelper'
import LowSupply from '../../components/LowSupply/LowSupply'
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
                <hr />
            </Container>
        </>
    )
}

export const metadata = getHeadMetadata('Linkvertise', 'Linkvertise task successful')
