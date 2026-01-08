import { Container } from 'react-bootstrap'
import { initAPI } from '../../api/ApiHelper'
import LowSupply from '../../components/LowSupply/LowSupply'
import NavBar from '../../components/NavBar/NavBar'
import { getHeadMetadata, getCanonicalUrl } from '../../utils/SSRUtils'

export default async function Page() {
    let api = initAPI(true)
    let lowSupplyItems = await api.getLowSupplyItems()

    return (
        <>
            <Container>
                <h2>
                    <NavBar />
                    Low Supply Items
                </h2>
                <hr />
                <LowSupply lowSupplyItems={lowSupplyItems} />
            </Container>
        </>
    )
}

export const metadata = getHeadMetadata(
    'Low Supply Items',
    'Items that are in low supply on the auction house',
    undefined,
    undefined,
    undefined,
    getCanonicalUrl('/lowSupply')
)

export const revalidate = 0
