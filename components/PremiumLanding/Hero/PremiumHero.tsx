import page from '../PremiumLanding.module.css'
import TrackedLink from '../TrackedLink'
import styles from './PremiumHero.module.css'

interface ReceiveTimeBar {
    tier: string
    tierClass: string
    value: string
    /** position on the axis from 0 (left edge) to 100, the API update is at 13.33 */
    from: number
    to: number
}

const API_UPDATE = 13.33

const RECEIVE_TIMES: ReceiveTimeBar[] = [
    { tier: 'Free', tierClass: page.tierFree, value: '~6 sec', from: API_UPDATE, to: 93.33 },
    { tier: 'Starter', tierClass: page.tierStarter, value: '~3 sec', from: API_UPDATE, to: 53.33 },
    { tier: 'Premium', tierClass: page.tierPremium, value: '~0 sec', from: API_UPDATE, to: API_UPDATE },
    { tier: 'Premium+', tierClass: page.tierPremiumPlus, value: '< 0 sec', from: 2, to: API_UPDATE }
]

const AXIS_LABELS = [
    { label: 'API update', at: API_UPDATE },
    { label: '+3 sec', at: 53.33 },
    { label: '+6 sec', at: 93.33 }
]

function Bar({ bar }: { bar: ReceiveTimeBar }) {
    const isDot = bar.from === bar.to
    return (
        <div className={styles.barRow}>
            <span className={`${styles.barTier} ${bar.tierClass}`}>{bar.tier}</span>
            <div className={styles.track} aria-hidden="true">
                {isDot ? (
                    <div className={`${styles.dot} ${bar.tierClass}`} style={{ left: `${bar.from}%` }} />
                ) : (
                    <div className={`${styles.fill} ${bar.tierClass}`} style={{ left: `${bar.from}%`, width: `${bar.to - bar.from}%` }} />
                )}
                <div className={styles.marker} style={{ left: `${API_UPDATE}%` }} />
            </div>
            <span className={styles.barValue}>{bar.value}</span>
        </div>
    )
}

function ReceiveTimeCard() {
    return (
        <div className={`${page.card} ${styles.receiveCard}`}>
            <div className={styles.receiveHead}>
                <h2 className={styles.receiveTitle}>Average Flip Receive Time</h2>
                <span className={styles.small}>Shorter is better</span>
            </div>
            <div className={styles.bars}>
                {RECEIVE_TIMES.map(bar => (
                    <Bar key={bar.tier} bar={bar} />
                ))}
                <div className={styles.barRow} aria-hidden="true">
                    <span />
                    <div className={styles.axis}>
                        {AXIS_LABELS.map(axis => (
                            <span key={axis.label} style={{ left: `${axis.at}%` }}>
                                {axis.label}
                            </span>
                        ))}
                    </div>
                    <span />
                </div>
            </div>
            <p className={styles.small}>
                Measured from the Hypixel API update until the flip reaches you, averaged over recent flips. Premium+ is below 0 because flips that mod
                users find before the API lists them reach Premium+ first.
            </p>
        </div>
    )
}

export default function PremiumHero() {
    return (
        <section className={styles.hero}>
            <div className={styles.copy}>
                <span className={styles.eyebrow}>SKYCOFL PREMIUM</span>
                <h1 className={styles.title}>Get Flips Before Everyone Else</h1>
                <p className={styles.lead}>
                    Premium delivers auction flips about 6 seconds sooner than a free account, unlocks the top results of every flip finder and adds tools
                    to the SkyCofl mod.
                </p>
                <div className={styles.actions}>
                    <TrackedLink href="#plans" className={page.primaryLink} action="hero link" details={{ target: 'plans' }}>
                        Choose a Plan
                    </TrackedLink>
                    <TrackedLink href="#compare" className={page.textLink} action="hero link" details={{ target: 'compare' }}>
                        Compare all features
                    </TrackedLink>
                </div>
                <div className={styles.proof}>
                    <span className={styles.proofValue}>5.9x</span>
                    <span className={styles.small}>
                        the daily profit of free users on Premium+. Median realized profit per user per day from AH flips, bazaar and tasks tracked by the mod,
                        measured over 24 hours on 2026-11-04.
                    </span>
                </div>
            </div>
            <ReceiveTimeCard />
        </section>
    )
}
