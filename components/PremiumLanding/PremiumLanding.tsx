import NavBar from '../NavBar/NavBar'
import { PromotionBanner } from '../Discounts/DiscountBanners'
import type { AutoDiscount } from '../../api/_generated/skyApi.schemas'
import ComparePlans from './Compare/ComparePlans'
import FeatureExplorer from './FeatureExplorer/FeatureExplorer'
import PremiumHero from './Hero/PremiumHero'
import PremiumPlansSection from './Plans/PremiumPlansSection'
import CommunityQuotes from './SocialProof/CommunityQuotes'
import { COMMUNITY_QUOTES } from './content/quotes'
import TrackedLink from './TrackedLink'
import styles from './PremiumLanding.module.css'

function ClosingCallToAction() {
    return (
        <section className={styles.section}>
            <div className={`${styles.sectionInner} ${styles.closing}`}>
                <h2 className={styles.closingTitle}>Pick a Plan, Upgrade Any Time</h2>
                <p className={styles.muted}>Already have Premium? You can extend it, add more time or move to a higher tier.</p>
                <TrackedLink href="#plans" className={`${styles.primaryLink} ${styles.closingLink}`} action="closing cta">
                    Choose a Plan
                </TrackedLink>
            </div>
        </section>
    )
}

/** the redesigned /premium page (variant "new" of the premium page A/B test) */
/** `likelyPromotion`: the promotion most visitors get, from the server; the sale banner reserves its space with it while loading */
export default function PremiumLanding({ likelyPromotion }: { likelyPromotion?: AutoDiscount | null }) {
    return (
        <div className={styles.landing}>
            <div className={styles.topBar}>
                <NavBar />
                <span className={styles.topBarTitle}>Premium</span>
            </div>
            <div className={styles.promotion}>
                <PromotionBanner href="#plans" likelyPromotion={likelyPromotion} />
            </div>
            <PremiumHero />
            <FeatureExplorer />
            <PremiumPlansSection communityQuotes={<CommunityQuotes quotes={COMMUNITY_QUOTES} />} />
            <ComparePlans />
            <ClosingCallToAction />
        </div>
    )
}
