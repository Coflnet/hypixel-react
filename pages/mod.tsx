import Link from 'next/link'
import { Button } from 'react-bootstrap'
import { Container } from 'react-bootstrap'
import ModDetails from '../components/ModDetails/ModDetails'
import NavBar from '../components/NavBar/NavBar'
import RatChecker from '../components/RatChecker/RatChecker'
import { getHeadElement } from '../utils/SSRUtils'

export default function Mod() {
    return (
        <div className="page">
            {getHeadElement('Mod')}
            <Container>
                <h2>
                    <NavBar />
                    CoflMod
                </h2>
                <div style={{ marginBottom: '20px' }}>
                    <ModDetails />
                </div>
                <RatChecker />
            </Container>
        </div>
    )
}
