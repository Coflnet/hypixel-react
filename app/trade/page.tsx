import { getHeadMetadata } from '../../utils/SSRUtils'
import NavBar from '../../components/NavBar/NavBar'
import { Container } from 'react-bootstrap'
import TradingOverview from '../../components/TradingOverview/TradingOverview'

export default async function Page() {
    return (
        <>
            <Container>
                <h2>
                    <NavBar />
                    <span>Trading</span>
                </h2>
                <TradingOverview />
            </Container>
        </>
    )
}

export const metadata = getHeadMetadata('Trading')
