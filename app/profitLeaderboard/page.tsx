import React from 'react'
import { getHeadMetadata } from '../../utils/SSRUtils'
import Premium from '../../components/Premium/Premium'
import { Container } from 'react-bootstrap'
import { getQueryClient } from '../../utils/QueryUtils'
import { getApiLeaderboardProfit, getGetApiLeaderboardProfitQueryKey } from '../../api/_generated/skyApi'
import NavBar from '../../components/NavBar/NavBar'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { ProfitLeaderboardComponent } from '../../components/ProfitLeaderboard/ProfitLeaderboard'

export default async function Page() {
    const queryClient = getQueryClient()
    queryClient.prefetchQuery({
        queryKey: [getGetApiLeaderboardProfitQueryKey()],
        queryFn: () => getApiLeaderboardProfit(),
    })
    return (
        <>
            <Container>
                <h2>
                    <NavBar />
                    Profit Leaderboard
                </h2>
                <hr />
                <HydrationBoundary state={dehydrate(queryClient)}>
                    <ProfitLeaderboardComponent />
                </HydrationBoundary>
            </Container>
        </>
    )
}

export const metadata = getHeadMetadata('Profit Leaderboard', 'Explore the top Hypixel SkyBlock traders with our Profit Leaderboard', undefined, ['leaderboard', 'profit', 'hypixel', 'skyblock', 'traders', 'trading', 'auction', 'bazaar'])
