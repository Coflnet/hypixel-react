import { getHeadMetadata } from '../../utils/SSRUtils'
import NavBar from '../../components/NavBar/NavBar'
import { Container } from 'react-bootstrap'

export default function Page() {
    return (
        <>
            <Container>
                <h2>
                    <NavBar />
                    <span>Trading</span>
                </h2>
            </Container>
        </>
    )
}

export const metadata = getHeadMetadata('Trading')
