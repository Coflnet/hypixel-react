import { getHeadMetadata } from '../../utils/SSRUtils'
import NavBar from '../../components/NavBar/NavBar'
import AuthMod from '../../components/AuthMod/AuthMod'
import { Container } from 'react-bootstrap'
import { getApiFlipBazaarSpread, getGetApiFlipBazaarSpreadQueryKey, useGetApiFlipBazaarSpread } from '../../api/_generated/skyApi'
import { BazaarFlips } from '../../components/BazaarFlips/BazaarFlips'
import { getQueryClient } from '../../utils/QueryUtils'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'

export default async function Page() {
    const queryClient = getQueryClient()
    queryClient.prefetchQuery({
        queryKey: [getGetApiFlipBazaarSpreadQueryKey()],
        queryFn: () => getApiFlipBazaarSpread(),
    })
    return (
        <>
            <Container>
                <h2>
                    <NavBar />
                    Bazaar Flips
                </h2>
                <hr />
                <HydrationBoundary state={dehydrate(queryClient)}>
                    <BazaarFlips />
                </HydrationBoundary>
            </Container>
        </>
    )
}

export const metadata = getHeadMetadata('Bazaar Flips')