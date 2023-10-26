import { Container } from 'react-bootstrap'
import Ref from '../../components/Ref/Ref'
import { getHeadMetadata } from '../../utils/SSRUtils'

export default function Page() {
    return (
        <>
            <Container>
                <Ref />
            </Container>
        </>
    )
}

export const metadata = getHeadMetadata('Referral', 'Our referral system allows you to get a reward for inviting others')
