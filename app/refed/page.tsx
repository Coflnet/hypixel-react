import { getHeadMetadata } from '../../utils/SSRUtils'
import RBContainer from '../../components/ReactBootstrapWrapper/Container'
import Search from '../../components/Search/Search'
import Refed from '../../components/Refed/Refed'

export default function Page() {
    return (
        <>
            <RBContainer>
                <Search />
                <Refed />
            </RBContainer>
        </>
    )
}

export const metadata = getHeadMetadata()
