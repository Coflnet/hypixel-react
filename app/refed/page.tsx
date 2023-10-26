import { getHeadMetadata } from '../../utils/SSRUtils'
import Search from '../../components/Search/Search'
import Refed from '../../components/Refed/Refed'
import { Container } from 'react-bootstrap'

export default function Page() {
    return (
        <>
            <Container>
                <Search />
                <Refed />
            </Container>
        </>
    )
}

export const metadata = getHeadMetadata()
