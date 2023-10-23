import { getHeadMetadata } from '../../utils/SSRUtils'
import RBContainer from '../../components/ReactBootstrapWrapper/Container'
import NavBar from '../../components/NavBar/NavBar'
import AuthMod from '../../components/AuthMod/AuthMod'

export default async function Page() {
    return (
        <>
            <RBContainer>
                <h2>
                    <NavBar />
                    Authorize Mod
                </h2>
                <hr />
                <AuthMod />
            </RBContainer>
        </>
    )
}

export const metadata = getHeadMetadata('Authenticate Mod')

export const revalidate = 0
