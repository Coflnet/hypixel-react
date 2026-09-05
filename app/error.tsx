'use client'
import { getHeadMetadata } from '../utils/SSRUtils'
import { Error } from '../components/Error/Error'

export default function Custom500({ error }) {
    return (
        <>
            <Error title="Unable to load this page" errorObject={error} onRetry={() => window.location.reload()} />
        </>
    )
}

export const metadata = getHeadMetadata(
    'Error',
    'An error occurred while loading the page. Please try again or contact support if the issue persists. Our Hypixel SkyBlock tools are usually available 24/7 for reliable auction and bazaar tracking.'
)
