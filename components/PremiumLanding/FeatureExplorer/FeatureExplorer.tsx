'use client'
import { useState } from 'react'
import { getChatColor } from '../content/chatColors'
import { FEATURE_TABS, FeatureTab, getFeaturesOfTab, PremiumFeature } from '../content/features'
import { TIER_CLASS, TIER_NAMES } from '../content/tiers'
import FeatureMediaBox from '../FeatureMedia/FeatureMediaBox'
import { usePremiumVariant } from '../../Premium/PremiumVariantContext'
import { trackPremiumPageEvent } from '../../../utils/PremiumTracking'
import page from '../PremiumLanding.module.css'
import styles from './FeatureExplorer.module.css'

function TierValue({ value, chatColor }: { value: string; chatColor?: boolean }) {
    if (value === 'No') return <span className={styles.valueNo}>{value}</span>
    const color = chatColor ? getChatColor(value) : undefined
    return <span style={color ? { color } : undefined}>{value}</span>
}

function TierCells({ feature }: { feature: PremiumFeature }) {
    return (
        <div className={styles.tierInfo}>
            <span className={styles.metric}>{feature.metric}</span>
            <div className={styles.tierCells}>
                {TIER_NAMES.map((tier, index) => (
                    <div key={tier} className={styles.tierCell}>
                        <span className={`${styles.tierName} ${page[TIER_CLASS[tier]]}`}>{tier}</span>
                        <TierValue value={feature.values[index]} chatColor={feature.chatColors} />
                    </div>
                ))}
            </div>
        </div>
    )
}

function FeatureButton({ feature, selected, onSelect }: { feature: PremiumFeature; selected: boolean; onSelect(id: string): void }) {
    return (
        <button type="button" className={styles.featureButton} aria-pressed={selected} onClick={() => onSelect(feature.id)}>
            <span className={styles.featureHead}>
                <span className={styles.featureTitle}>{feature.title}</span>
                <span className={`${page.badge} ${page[`badge${TIER_CLASS[feature.minTier]}`]}`}>{feature.minTier}</span>
            </span>
            <span className={styles.featureShort}>{feature.short}</span>
        </button>
    )
}

function Stage({ feature }: { feature: PremiumFeature }) {
    const variant = usePremiumVariant()
    return (
        <div className={styles.stage} data-testid="feature-stage">
            <FeatureMediaBox
                featureId={feature.id}
                title={feature.title}
                media={feature.media}
                onClipStart={trigger => trackPremiumPageEvent('clip play', variant, { feature: feature.id, trigger, place: 'explorer' })}
            />
            <div className={styles.caption}>
                <div className={styles.captionText}>
                    <h3 className={styles.stageTitle}>{feature.title}</h3>
                    <p className={page.muted}>{feature.long}</p>
                </div>
                <TierCells feature={feature} />
            </div>
        </div>
    )
}

export default function FeatureExplorer() {
    const variant = usePremiumVariant()
    const [tab, setTab] = useState<FeatureTab>('web')
    const [selectedId, setSelectedId] = useState<string>()
    const features = getFeaturesOfTab(tab)
    const selected = features.find(feature => feature.id === selectedId) ?? features[0]

    function selectTab(next: FeatureTab) {
        if (next === tab) return
        setTab(next)
        setSelectedId(undefined)
        trackPremiumPageEvent('explorer tab', variant, { tab: next })
    }

    function selectFeature(id: string) {
        if (id === selected.id) return
        setSelectedId(id)
        trackPremiumPageEvent('feature selected', variant, { feature: id })
    }

    return (
        <section id="features" className={page.section}>
            <div className={page.sectionInner}>
                <div className={page.sectionHead}>
                    <h2 className={page.sectionTitle}>See What You Get</h2>
                    <p className={page.muted}>Pick a feature to watch it. One plan covers the website and the in-game mod.</p>
                </div>
                <div className={styles.tabs}>
                    {FEATURE_TABS.map(({ id, label }) => (
                        <button key={id} type="button" className={styles.tab} aria-pressed={tab === id} onClick={() => selectTab(id)}>
                            {label}
                        </button>
                    ))}
                </div>
                <div className={styles.explorer}>
                    <Stage feature={selected} />
                    <div className={styles.featureList} aria-label="Features">
                        {features.map(feature => (
                            <FeatureButton key={feature.id} feature={feature} selected={feature.id === selected.id} onSelect={selectFeature} />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
