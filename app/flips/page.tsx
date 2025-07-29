import { Container } from 'react-bootstrap'
import FlippingHub from '../../components/FlippingHub/FlippingHub'
import { getHeadMetadata } from '../../utils/SSRUtils'
import Search from '../../components/Search/Search'
import NavBar from '../../components/NavBar/NavBar'
import Link from 'next/link'

export default function FlippingHubPage() {
    return (
        <>
            <Container>
                <Search />

                <h1>Flipping Hub</h1>
                <p>Welcome to the SkyCofl Flipping Hub! Explore all major Hypixel SkyBlock flipping strategies in one place. Each flip kind is explained in detail to help you maximize your profits and discover new opportunities.</p>
                <p>Let us know if you are missing any on our discord we will add them shortly. For the best experience we recommend also using our <Link href="/mod">mod</Link></p>
                <FlippingHub />
            </Container>
        </>
    )
}

export const metadata = getHeadMetadata('Flipping Hub', 'Explore all Hypixel SkyBlock flipping strategies: Kat, Craft, AH, Composter, Bazaar, Forge flips and more. Detailed guides and profit tips for every flip kind.')

export const revalidate = 0