import NavBar from '../../components/NavBar/NavBar'
import RBContainer from '../../components/ReactBootstrapWrapper/Container'
import SubscriptionList from '../../components/SubscriptionList/SubscriptionList'
import { getHeadMetadata } from '../../utils/SSRUtils'

export default function Page() {
    return (
        <>
            <RBContainer>
                <h2>
                    <NavBar />
                    Your Notifiers
                </h2>
                <hr />
                <SubscriptionList />
            </RBContainer>
        </>
    )
}

export const metadata = getHeadMetadata('Notifiers')
