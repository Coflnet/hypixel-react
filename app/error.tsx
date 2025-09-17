'use client'
import { getHeadMetadata } from '../utils/SSRUtils'
import { Error } from '../components/Error/Error'

export default function Custom500({ error }) {
    return (
        <>
            <Error title="500 - Server-side error occurred" errorObject={error} />
        </>
    )
}

export const metadata = getHeadMetadata('Error', 'An error occurred while loading the page. Please try again or contact support if the issue persists. Our Hypixel SkyBlock tools are usually available 24/7 for reliable auction and bazaar tracking.')
