import { Container } from 'react-bootstrap'
import NavBar from '../../components/NavBar/NavBar'
import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { getQueryClient } from '../../utils/QueryUtils'
import AttributeFlips from '../../components/AttributeFlips/AttributeFlips'
import { getHeadMetadata } from '../../utils/SSRUtils'
import { fetchAttributeFlips } from '../../api/attributeFlips'

export default async function Page() {
    const queryClient = getQueryClient()

    await queryClient.prefetchQuery({
        queryKey: ['attributeFlips', 'default'],
        queryFn: () => fetchAttributeFlips()
    })

    return (
        <Container>
            <h2>
                <NavBar />
                Attribute Flips
            </h2>
            <hr />
            <HydrationBoundary state={dehydrate(queryClient)}>
                <AttributeFlips />
            </HydrationBoundary>
        </Container>
    )
}

export const metadata = getHeadMetadata(
    'Attribute Flips',
    'Discover profitable Hypixel SkyBlock item upgrade flips using attributes, enchants, and modifiers. Compare base cost, materials, and sale prices to find the best upgrades.',
    undefined,
    ['attribute flips', 'item upgrades', 'hypixel skyblock attributes', 'attribute shards', 'hex upgrades'],
    'Attribute Flip Profit Calculator | Hypixel SkyBlock'
)

export const revalidate = 0
