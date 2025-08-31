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

export const metadata = getHeadMetadata('Referral Success', 'Welcome! You\'ve been referred to the best Hypixel SkyBlock auction house and bazaar tracking tools. Start exploring profitable flips, price history, and trading opportunities.')
