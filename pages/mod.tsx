import Link from 'next/link'
import { Button } from 'react-bootstrap'
import { Container } from 'react-bootstrap'
import ModDetails from '../components/ModDetails/ModDetails'
import RatChecker from '../components/RatChecker/RatChecker'
import { getHeadElement } from '../utils/SSRUtils'

export default function Mod() {
    return (
        <div className="page">
            {getHeadElement('Mod')}
            <Container>
                <h1>Minecraft Mod</h1>
                <div style={{ marginBottom: '20px' }}>
                    <ModDetails />
                </div>
                <RatChecker />
            </Container>
        </div>
    )
}
