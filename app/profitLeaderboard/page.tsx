import React from 'react'
import { getHeadMetadata, getCanonicalUrl } from '../../utils/SSRUtils'
import Premium from '../../components/Premium/Premium'
import { Container } from 'react-bootstrap'
import { getQueryClient } from '../../utils/QueryUtils'
import { getApiLeaderboardProfit, getGetApiLeaderboardProfitQueryKey } from '../../api/_generated/skyApi'
import NavBar from '../../components/NavBar/NavBar'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { ProfitLeaderboardComponent } from '../../components/ProfitLeaderboard/ProfitLeaderboard'
import { ToolLandingSeo } from '../../components/Seo/ToolLandingSeo'
import { toolLandingSeoContent } from '../../components/Seo/toolLandingSeoContent'

const seoContent = toolLandingSeoContent.profitLeaderboard

export default async function Page() {
    const queryClient = getQueryClient()
    queryClient.prefetchQuery({
        queryKey: [getGetApiLeaderboardProfitQueryKey()],
        queryFn: () => getApiLeaderboardProfit()
    })
    return (
        <>
            <Container>
                <NavBar />
                <h1>Profit Leaderboard</h1>
                <hr />
                <HydrationBoundary state={dehydrate(queryClient)}>
                    <ProfitLeaderboardComponent />
                </HydrationBoundary>
                <ToolLandingSeo content={seoContent} />
            </Container>
        </>
    )
}

export const metadata = getHeadMetadata(
    seoContent.metadataTitle,
    seoContent.metadataDescription,
    undefined,
    [
        'leaderboard',
        'profit',
        'hypixel',
        'skyblock',
        'traders',
        'trading',
        'auction',
        'bazaar'
    ],
    undefined,
    getCanonicalUrl('/profitLeaderboard')
)
