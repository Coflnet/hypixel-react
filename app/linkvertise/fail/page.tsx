import { Container } from 'react-bootstrap'
import NavBar from '../../../components/NavBar/NavBar'
import Link from 'next/link'
import { getHeadMetadata } from '../../../utils/SSRUtils'

export default async function Page() {
    return (
        <>
            <Container>
                <h2>
                    <NavBar />
                    Linkvertise task failed
                </h2>
                <hr />
                <p>
                    Unfortunately something went wrong. You can try again <Link href="/linkvertise">here</Link>.
                </p>
            </Container>
        </>
    )
}

export const metadata = getHeadMetadata('Linkvertise', 'Linkvertise task failed')
