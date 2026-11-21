import React from 'react'
import { headers } from 'next/headers'
import { getHeadMetadata, getCanonicalUrl } from '../../utils/SSRUtils'
import Premium from '../../components/Premium/Premium'
import PremiumLanding from '../../components/PremiumLanding/PremiumLanding'
import PremiumCheckoutSurface from '../../components/Premium/PremiumCheckoutSurface'
import { PremiumVariantProvider } from '../../components/Premium/PremiumVariantContext'
import { BOT_VARIANT_VALUE, CONTROL_VARIANT, isPremiumVariant, PREMIUM_VARIANT_HEADER, PremiumVariant } from '../../utils/PremiumExperiment'
import { Container } from 'react-bootstrap'
import { COUNTRY_HEADER, getLikelyPromotion } from '../../utils/PromotionHint'

// The A/B variant is derived from the user agent by the middleware, so this page must never be cached as one shared HTML.
export const dynamic = 'force-dynamic'

/** the variant the middleware assigned; undefined for bots, which see the control but are not part of the experiment */
async function getExperimentVariant(): Promise<PremiumVariant | undefined> {
    const value = (await headers()).get(PREMIUM_VARIANT_HEADER)
    if (value === BOT_VARIANT_VALUE) return undefined
    return isPremiumVariant(value) ? value : CONTROL_VARIANT
}

export default async function Page() {
    // the page is rendered per request: the banner's space is reserved only where the visitor's country gets the sale
    const requestHeaders = await headers()
    const country = requestHeaders.get(COUNTRY_HEADER)
    const mayBePlayApp = /android/i.test(requestHeaders.get('user-agent') ?? '')
    const [variant, likelyPromotion] = await Promise.all([getExperimentVariant(), getLikelyPromotion(country)])
    return (
        <PremiumVariantProvider variant={variant}>
            <PremiumCheckoutSurface mayBePlayApp={mayBePlayApp}>
                {variant === 'new' ? (
                    <PremiumLanding likelyPromotion={likelyPromotion} />
                ) : (
                    <Container>
                        <Premium likelyPromotion={likelyPromotion} />
                    </Container>
                )}
            </PremiumCheckoutSurface>
        </PremiumVariantProvider>
    )
}

export const metadata = getHeadMetadata(
    'Premium',
    'SkyCofl Premium for Hypixel SkyBlock: receive auction flips seconds sooner, unlock the top results of every flip finder, get Premium Bazaar flips, data exports and in-game mod tools. Compare Starter, Premium and Premium+.',
    undefined,
    undefined,
    undefined,
    getCanonicalUrl('/premium')
)
