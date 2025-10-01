import { Container } from 'react-bootstrap'
import NavBar from '../../components/NavBar/NavBar'
import SubscriptionList from '../../components/SubscriptionList/SubscriptionList'
import { getHeadMetadata } from '../../utils/SSRUtils'
import Search from '../../components/Search/Search'

export default function Page() {
    return (
        <>
            <Container>
                <Search />
                <h2>Your Notifiers</h2>
                <hr />
                <SubscriptionList />
            </Container>
        </>
    )
}

export const metadata = getHeadMetadata(
    'Notifiers',
    'Set up custom price alerts and notifications for Hypixel SkyBlock items. Get notified about auction house deals, bazaar price changes, and profitable flipping opportunities via Discord or in-game.'
)
