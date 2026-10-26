'use client'

import { usePathname } from 'next/navigation'
import Script from 'next/script'
import { useAds } from './Providers/AdsProvider'
import NitroRailAd from './Ads/NitroRailAd'
import properties from '../properties'

export default function AdScriptLoader() {
    const pathname = usePathname() || ''
    const { shouldShowAds, isAdsEligibilityKnown } = useAds()

    const matchesAdRoute = pathname !== '/' && pathname != '/about' && pathname != '/premium' && pathname != '/account'
    // the script is only requested once the premium cache has been checked, it keeps running after an unmount
    const shouldLoadAds = isAdsEligibilityKnown && shouldShowAds && matchesAdRoute && !properties.isTestRunner

    if (!shouldLoadAds) {
        return null
    }

    return (
        <>
            <Script
                data-cfasync="false"
                dangerouslySetInnerHTML={{
                    __html:
                        "window.nitroAds=window.nitroAds||{createAd:function(){return new Promise(e=>{window.nitroAds.queue.push(['createAd',arguments,e])})},addUserToken:function(){window.nitroAds.queue.push(['addUserToken',arguments])},queue:[]};"
                }}
            />
            <Script data-cfasync="false" async src="https://s.nitropay.com/ads-2186.js" />
            <NitroRailAd />
        </>
    )
}