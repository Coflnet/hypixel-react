import Link from 'next/link'
import { Button } from 'react-bootstrap'
import { Container } from 'react-bootstrap'
import { getHeadElement } from '../utils/SSRUtils'

export default function Custom500() {
    return (
        <div className="page">
            {getHeadElement('Error')}
            <Container>
                <h1>500 - Server-side error occurred</h1>
                <Link href="/" className="disableLinkStyle">

                    <Button>Return to main page</Button>

                </Link>
            </Container>
        </div>
    );
}
