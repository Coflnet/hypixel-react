import { Container } from 'react-bootstrap'
import NavBar from '../../components/NavBar/NavBar'
import SubscriptionList from '../../components/SubscriptionList/SubscriptionList'
import { getHeadMetadata } from '../../utils/SSRUtils'

export default function Page() {
    return (
        <>
            <Container>
                <h2>
                    <NavBar />
                    Your Notifiers
                </h2>
                <hr />
                <SubscriptionList />
            </Container>
        </>
    )
}

export const metadata = getHeadMetadata('Notifiers')
