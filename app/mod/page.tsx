import ModDetails from '../../components/ModDetails/ModDetails'
import NavBar from '../../components/NavBar/NavBar'
import RatChecker from '../../components/RatChecker/RatChecker'
import RBContainer from '../../components/ReactBootstrapWrapper/Container'
import { getHeadMetadata } from '../../utils/SSRUtils'

export default function Mod() {
    return (
        <>
            <RBContainer>
                <NavBar />
                <ModDetails />
                <RatChecker />
            </RBContainer>
        </>
    )
}

export const metadata = getHeadMetadata('Mod')
