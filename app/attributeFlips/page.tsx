import { Container } from 'react-bootstrap'
import NavBar from '../../components/NavBar/NavBar'
import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { getQueryClient } from '../../utils/QueryUtils'
import AttributeFlips from '../../components/AttributeFlips/AttributeFlips'
import { getHeadMetadata, getCanonicalUrl } from '../../utils/SSRUtils'
import { getApiFlipAttribute, getGetApiFlipAttributeQueryKey } from '../../api/_generated/skyApi'
import { ToolLandingSeo } from '../../components/Seo/ToolLandingSeo'
import { toolLandingSeoContent } from '../../components/Seo/toolLandingSeoContent'

const seoContent = toolLandingSeoContent.attributeFlips

export default async function Page() {
    const queryClient = getQueryClient()

    return (
        <Container>
            <NavBar />
            <h1>Attribute Flips</h1>
            <hr />
            <HydrationBoundary state={dehydrate(queryClient)}>
                <AttributeFlips />
            </HydrationBoundary>
            <ToolLandingSeo content={seoContent} />
        </Container>
    )
}

export const metadata = getHeadMetadata(
    seoContent.metadataTitle,
    seoContent.metadataDescription,
    undefined,
    ['attribute flips', 'item upgrades', 'hypixel skyblock attributes', 'attribute shards', 'hex upgrades'],
    'Attribute Flip Profit Calculator | Hypixel SkyBlock',
    getCanonicalUrl('/attributeFlips')
)

export const revalidate = 0
