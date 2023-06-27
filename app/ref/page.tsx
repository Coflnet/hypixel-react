import RBContainer from '../../components/ReactBootstrapWrapper/Container'
import Ref from '../../components/Ref/Ref'
import { getHeadMetadata } from '../../utils/SSRUtils'

export default function Page() {
    return (
        <>
            <RBContainer>
                <Ref />
            </RBContainer>
        </>
    )
}

export const metadata = getHeadMetadata('Referral', 'Our referral system allows you to get a reward for inviting others')
