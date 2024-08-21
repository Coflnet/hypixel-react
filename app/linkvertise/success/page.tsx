import { Container } from 'react-bootstrap'
import NavBar from '../../../components/NavBar/NavBar'
import { getHeadMetadata } from '../../../utils/SSRUtils'
import Link from 'next/link'

export default async function Page() {
    return (
        <>
            <Container>
                <h2>
                    <NavBar />
                    Linkvertise task successful
                </h2>
                <hr />
                <p>You successfully completed the Linkvertise task. You received the reward and can close this page now :).</p>
                <p>
                    If you want access for longer consider supporting us directly by <Link href="/premium">buying a premium tier</Link>
                </p>
            </Container>
        </>
    )
}

export const metadata = getHeadMetadata('Linkvertise', 'Linkvertise task successful')
