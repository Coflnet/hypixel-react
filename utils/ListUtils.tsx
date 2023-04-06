import Link from 'next/link'
import GoogleSignIn from '../components/GoogleSignIn/GoogleSignIn'
import { PREMIUM_RANK } from './PremiumTypeUtils'

/**
 * Utility functon for the recent and active auctions lists
 * Displayed if more auctions could be loaded with premium
 */
export function getMoreAuctionsElement(isLoggedIn: boolean, premiumType: PremiumType, onAfterLogin: () => void, textForStarterPremium: JSX.Element) {
    if (!isLoggedIn || !premiumType) {
        return (
            <div>
                You can see more auctions with{' '}
                <Link href={'/premium'} style={{ marginBottom: '15px' }}>
                    Premium
                </Link>
                <GoogleSignIn onAfterLogin={onAfterLogin} />
            </div>
        )
    }
    if (premiumType.priority === PREMIUM_RANK.STARTER) {
        return (
            <div>
                {textForStarterPremium}
                <div style={{ marginTop: '15px' }}>
                    <GoogleSignIn onAfterLogin={onAfterLogin} />
                </div>
            </div>
        )
    }
}
