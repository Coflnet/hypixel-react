import { initAPI } from '../../api/ApiHelper'
import LowSupply from '../../components/LowSupply/LowSupply'
import NavBar from '../../components/NavBar/NavBar'
import RBContainer from '../../components/ReactBootstrapWrapper/Container'
import { getHeadMetadata } from '../../utils/SSRUtils'

export default async function Page() {
    let api = initAPI(true)
    let lowSupplyItems = await api.getLowSupplyItems()

    return (
        <>
            <RBContainer>
                <h2>
                    <NavBar />
                    Low Supply Items
                </h2>
                <hr />
                <LowSupply lowSupplyItems={lowSupplyItems} />
            </RBContainer>
        </>
    )
}

export const metadata = getHeadMetadata('Low Supply Items', 'Items that are in low supply on the auction house')
