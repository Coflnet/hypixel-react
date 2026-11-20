import {
    formatUtcDay,
    getUserAgentBucket,
    getVariantHeaderValue,
    hashText,
    isBotUserAgent,
    pickVariant,
    PREMIUM_EXPERIMENT,
    PremiumExperimentConfig,
    PremiumVariant,
    resolvePremiumVariant,
    withVariantOverride
} from '../../utils/PremiumExperiment'
import {
    buildPremiumEvent,
    formatEventName,
    pushMatomoEvent,
    trackExperimentExposure,
    trackPremiumFunnelEvent,
    trackPremiumPageEvent
} from '../../utils/PremiumTracking'
import { getAutoplayPolicy, PlaybackState, shouldLoadClip, shouldPlayClip } from '../../utils/ClipAutoplay'
import { DEFAULT_FEATURE_MEDIA_BASE, formatClipLength, getFeatureMediaUrls } from '../../utils/FeatureMedia'
import { PREMIUM_FEATURES } from '../../components/PremiumLanding/content/features'
import { COMPARE_GROUPS } from '../../components/PremiumLanding/content/comparison'
import { PLAN_CARDS } from '../../components/PremiumLanding/content/plans'
import { getPlanNoteText, getPlanPrice, PlanPrice } from '../../components/PremiumLanding/content/planPricing'
import {
    describeBestAmount,
    describeCodeTerms,
    describePromotionEnd,
    formatPromotionEnd,
    getMaxPercent,
    getPaymentSavingCents,
    isHonouredByAll,
    weighLinkCode
} from '../../utils/SubscriptionCheckout'
import { getPurchaseTarget, getSignInActionTarget, getSignInStep } from '../../components/Premium/purchaseTarget'
import { ANONYMOUS_AUTHOR, formatQuoteDate, getQuoteAuthor } from '../../components/PremiumLanding/SocialProof/quoteFormat'
import { COMMUNITY_QUOTES } from '../../components/PremiumLanding/content/quotes'
import { placePopover } from '../../components/PremiumLanding/Compare/usePreviewPopover'
import { tearDownWhenRemoved } from '../../components/PremiumLanding/FeatureMedia/useClipPlayer'
import { getChatColor } from '../../components/PremiumLanding/content/chatColors'
import { Duration, PremiumTier, PurchaseType } from '../../components/Premium/PremiumPurchaseWizard/types'
import { getStepDisplay } from '../../components/Premium/PremiumPurchaseWizard/stepDisplay'
import { formatMoney } from '../../utils/PricingUtils'
import {
    canSelectTier,
    getNextStep,
    getPreviousStep,
    getStepFlow,
    getStepHelper,
    getStepTitle,
    getSummaryChips,
    isPointerClick,
    STEP,
    WizardState
} from '../../components/Premium/PremiumPurchaseWizard/wizardFlow'

const BROWSER = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
const GOOGLEBOT = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
/** a fixed request time, so the specs do not depend on the day they run */
const NOW = new Date('2026-11-16T12:00:00Z')
const NEXT_DAY = new Date('2026-11-17T12:00:00Z')

function config(weights: PremiumExperimentConfig['weights'], name = PREMIUM_EXPERIMENT.name): PremiumExperimentConfig {
    return { name, weights }
}

/** a fixed sample of distinct user agents; real browsers send reduced strings, so real traffic clusters into far fewer buckets */
function sampleUserAgents(count = 2000): string[] {
    const platforms = ['Windows NT 10.0; Win64; x64', 'Macintosh; Intel Mac OS X 10_15_7', 'X11; Linux x86_64', 'Linux; Android 14; Pixel 8']
    return Array.from(
        { length: count },
        (_, i) => `Mozilla/5.0 (${platforms[i % platforms.length]}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${100 + (i % 40)}.0.${i}.0 Safari/537.36`
    )
}

function variantsOf(userAgents: string[], experiment: PremiumExperimentConfig = PREMIUM_EXPERIMENT, now: Date = NOW): PremiumVariant[] {
    return userAgents.map(userAgent => resolvePremiumVariant({ userAgent, now }, experiment).variant)
}

function movedShare(before: PremiumVariant[], after: PremiumVariant[]): number {
    return before.filter((variant, i) => variant !== after[i]).length / before.length
}

function share(variants: PremiumVariant[], variant: PremiumVariant): number {
    return variants.filter(v => v === variant).length / variants.length
}

describe('Premium page experiment assignment', () => {
    it('uses a pinned FNV-1a based hash over name, UTC day and user agent (changing it would reshuffle every visitor)', () => {
        expect(hashText('')).to.equal(2872998923)
        expect(hashText('a')).to.equal(444641715)
        expect(hashText(`premium-page-2026-11\n2026-11-16\n${BROWSER}`)).to.equal(1689905075)
        expect(getUserAgentBucket(BROWSER, NOW, config({ current: 50, new: 50 }, 'premium-page-2026-11'))).to.equal(1689905075 / 2 ** 32)
        const bucket = getUserAgentBucket(BROWSER, NOW)
        expect(bucket).to.be.at.least(0)
        expect(bucket).to.be.below(1)
    })

    it('formats the UTC day, also where the local day differs', () => {
        expect(formatUtcDay(new Date('2026-11-16T00:00:00Z'))).to.equal('2026-11-16')
        expect(formatUtcDay(new Date('2026-11-16T23:59:59.999Z'))).to.equal('2026-11-16')
        expect(formatUtcDay(new Date('2026-11-17T00:30:00+02:00'))).to.equal('2026-11-16')
    })

    it('gives the same user agent the same variant on every request of a UTC day, without storing anything', () => {
        const sameDay = [new Date('2026-11-16T00:00:00Z'), NOW, new Date('2026-11-16T23:59:59.999Z')]
        for (const userAgent of sampleUserAgents(50)) {
            const first = resolvePremiumVariant({ userAgent, now: NOW })
            expect(first.inExperiment).to.equal(true)
            for (const now of sameDay) expect(resolvePremiumVariant({ userAgent, now })).to.deep.equal(first)
        }
        expect(Object.keys(resolvePremiumVariant({ userAgent: BROWSER, now: NOW })).sort()).to.deep.equal(['inExperiment', 'variant'])
    })

    it('can put a user agent into another arm on another day', () => {
        const userAgents = sampleUserAgents(50)
        const today = variantsOf(userAgents)
        const tomorrow = variantsOf(userAgents, PREMIUM_EXPERIMENT, NEXT_DAY)
        expect(today.some((variant, i) => variant !== tomorrow[i])).to.equal(true)
        expect(getUserAgentBucket(BROWSER, NOW)).not.to.equal(getUserAgentBucket(BROWSER, NEXT_DAY))
    })

    it('moves about half of the user agents to the other arm from one day to the next', () => {
        const userAgents = sampleUserAgents()
        expect(movedShare(variantsOf(userAgents), variantsOf(userAgents, PREMIUM_EXPERIMENT, NEXT_DAY))).to.be.within(0.45, 0.55)
        // the split stays balanced on every day
        expect(share(variantsOf(userAgents, PREMIUM_EXPERIMENT, NEXT_DAY), 'new')).to.be.within(0.45, 0.55)
    })

    it('splits different user agents roughly by weight', () => {
        const userAgents = sampleUserAgents()
        const half = share(variantsOf(userAgents, config({ current: 50, new: 50 })), 'new')
        expect(half).to.be.within(0.45, 0.55)
        const fifth = share(variantsOf(userAgents, config({ current: 80, new: 20 })), 'new')
        expect(fifth).to.be.within(0.16, 0.24)
    })

    it('reshuffles when the experiment is renamed', () => {
        const userAgents = sampleUserAgents()
        const before = variantsOf(userAgents, config({ current: 50, new: 50 }, 'premium-page-a'))
        const after = variantsOf(userAgents, config({ current: 50, new: 50 }, 'premium-page-b'))
        expect(movedShare(before, after)).to.be.within(0.4, 0.6)
    })

    it('lets the QA query parameter override only the request that carries it', () => {
        const userAgent = sampleUserAgents().find(ua => resolvePremiumVariant({ userAgent: ua, now: NOW }).variant === 'current')!
        expect(resolvePremiumVariant({ userAgent, queryOverride: 'new', now: NOW })).to.deep.equal({ variant: 'new', inExperiment: true })
        expect(resolvePremiumVariant({ userAgent, now: NOW }).variant).to.equal('current')
        expect(resolvePremiumVariant({ userAgent, queryOverride: 'bogus', now: NOW }).variant).to.equal('current')
    })

    it('keeps the QA override on links that reload /premium', () => {
        expect(withVariantOverride('/premium?slots=true#buyPremium', 'new')).to.equal('/premium?slots=true&premiumVariant=new#buyPremium')
        expect(withVariantOverride('/premium?slots=true#buyPremium', null)).to.equal('/premium?slots=true#buyPremium')
        expect(withVariantOverride('/premium?slots=true#buyPremium', 'bogus')).to.equal('/premium?slots=true#buyPremium')
    })

    it('always serves the control to bots and requests without a user agent', () => {
        for (const userAgent of [GOOGLEBOT, 'Mozilla/5.0 (compatible; bingbot/2.0)', 'facebookexternalhit/1.1', 'curl/8.4.0', '', null, undefined]) {
            expect(resolvePremiumVariant({ userAgent, queryOverride: 'new', now: NOW })).to.deep.equal({ variant: 'current', inExperiment: false })
        }
        expect(getVariantHeaderValue(resolvePremiumVariant({ userAgent: GOOGLEBOT, now: NOW }))).to.equal('bot')
        expect(getVariantHeaderValue(resolvePremiumVariant({ userAgent: BROWSER, queryOverride: 'new', now: NOW }))).to.equal('new')
        for (const userAgent of [BROWSER, 'Mozilla/5.0 (Linux; Android 11; CUBOT X50) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36']) {
            expect(isBotUserAgent(userAgent), userAgent).to.equal(false)
        }
        for (const userAgent of ['Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)', 'Mozilla/5.0 (compatible; YandexBot/3.0)', 'Twitterbot/1.0']) {
            expect(isBotUserAgent(userAgent), userAgent).to.equal(true)
        }
    })

    it('ends the test when one variant gets 100%', () => {
        const userAgents = sampleUserAgents(500)
        expect(new Set(variantsOf(userAgents, config({ current: 0, new: 100 })))).to.deep.equal(new Set(['new']))
        expect(new Set(variantsOf(userAgents, config({ current: 100, new: 0 })))).to.deep.equal(new Set(['current']))
        for (const bucket of [0, 0.5, 0.999]) {
            expect(pickVariant(bucket, config({ current: 0, new: 100 }))).to.equal('new')
            expect(pickVariant(bucket, config({ current: 100, new: 0 }))).to.equal('current')
        }
    })

    it('falls back to the control when all weights are zero', () => {
        expect(pickVariant(0.5, config({ current: 0, new: 0 }))).to.equal('current')
    })
})

describe('Premium tracking helper', () => {
    it('formats event names as key=value pairs, variant first, without empty values', () => {
        expect(formatEventName({ variant: 'new', tier: 'premium', empty: undefined, none: null })).to.equal('variant=new;tier=premium')
        expect(formatEventName({ text: 'a;b=c' })).to.equal('text=a_b_c')
        expect(formatEventName({})).to.equal(undefined)
        expect(buildPremiumEvent('premium page', 'plan button', 'new', { tier: 'premium' })).to.deep.equal({
            category: 'premium page',
            action: 'plan button',
            name: 'variant=new;tier=premium'
        })
        expect(buildPremiumEvent('premium funnel', 'wizard step', undefined)).to.deep.equal({ category: 'premium funnel', action: 'wizard step' })
    })

    it('pushes a Matomo trackEvent instruction', () => {
        const queue: unknown[][] = []
        pushMatomoEvent({ category: 'premium page', action: 'feature selected', name: 'variant=new;feature=finders' }, queue)
        trackExperimentExposure('premium-page-test', 'new', queue)
        expect(queue).to.deep.equal([
            ['trackEvent', 'premium page', 'feature selected', 'variant=new;feature=finders'],
            ['trackEvent', 'experiment', 'premium-page-test', 'new']
        ])
    })

    it('never throws when Matomo is missing or blocked', () => {
        const page = window as Window & { _paq?: unknown }
        const original = page._paq
        try {
            delete page._paq
            expect(() => trackPremiumFunnelEvent('wizard step', 'new', { step: 1 })).not.to.throw()
            expect(() => pushMatomoEvent({ category: 'a', action: 'b' }, undefined)).not.to.throw()
            const throwing = {
                push() {
                    throw new Error('blocked')
                }
            }
            expect(() => pushMatomoEvent({ category: 'a', action: 'b' }, throwing)).not.to.throw()
        } finally {
            page._paq = original
        }
    })

    it('tracks the sign-in prompt of an action as a page event, variant first', () => {
        const queue: unknown[][] = []
        trackPremiumPageEvent('sign in prompt', 'new', { source: 'coflcoins' }, queue)
        expect(queue).to.deep.equal([['trackEvent', 'premium page', 'sign in prompt', 'variant=new;source=coflcoins']])
    })

    it('only reports funnel events on the premium page (with a variant)', () => {
        const queue: unknown[][] = []
        trackPremiumFunnelEvent('checkout started', undefined, { product: 'l_premium' }, queue)
        trackPremiumFunnelEvent('checkout started', 'current', { product: 'l_premium', provider: 'subscription' }, queue)
        expect(queue).to.deep.equal([['trackEvent', 'premium funnel', 'checkout started', 'variant=current;product=l_premium;provider=subscription']])
    })

    it('reports page events of visitors outside the experiment (bots) without a variant', () => {
        const queue: unknown[][] = []
        trackPremiumPageEvent('plan button', undefined, { tier: 'premium' }, queue)
        trackPremiumPageEvent('closing cta', undefined, undefined, queue)
        expect(queue).to.deep.equal([
            ['trackEvent', 'premium page', 'plan button', 'tier=premium'],
            ['trackEvent', 'premium page', 'closing cta']
        ])
    })
})

describe('Chat color cells', () => {
    it('shows the chat color rows in the Minecraft colors and leaves other text alone', () => {
        expect(['Gray', 'White', 'Green', 'Gold'].map(getChatColor)).to.deep.equal(['#AAAAAA', '#FFFFFF', '#55FF55', '#FFAA00'])
        expect(getChatColor('2 min')).to.equal(undefined)
        const row = COMPARE_GROUPS.flatMap(group => group.rows).find(r => r.label === 'Chat color')
        expect(row?.chatColors).to.equal(true)
        expect(PREMIUM_FEATURES.find(feature => feature.id === 'chatflips')?.chatColors).to.equal(true)
    })
})

describe('Feature clip teardown', () => {
    function videoWithSources(): HTMLVideoElement {
        const video = document.createElement('video')
        ;['a.webm', 'a.mp4'].forEach(src => {
            const source = document.createElement('source')
            source.setAttribute('src', src)
            video.appendChild(source)
        })
        document.body.appendChild(video)
        return video
    }

    const sources = (video: HTMLVideoElement) => Array.from(video.querySelectorAll('source')).map(source => source.getAttribute('src'))

    // regression: React's development StrictMode detaches and re-attaches the ref once; tearing that video down left
    // it without sources, so every clip showed "Clip unavailable" before any request was made
    it('keeps the sources of a video React detached but kept in the page', () => {
        const video = videoWithSources()
        tearDownWhenRemoved(video, task => task())
        expect(sources(video)).to.deep.equal(['a.webm', 'a.mp4'])
        video.remove()
    })

    it('stops the download of a removed video', () => {
        const video = videoWithSources()
        video.remove()
        tearDownWhenRemoved(video, task => task())
        expect(sources(video)).to.deep.equal([null, null])
    })
})

describe('Feature clip player decisions', () => {
    const base: PlaybackState = { policy: 'auto', inView: true, visible: true, pageVisible: true, started: false, tapped: false, userPaused: false, failed: false }

    it('only autoplays without reduced motion, data saver and touch-first input', () => {
        expect(getAutoplayPolicy(null)).to.equal('unknown')
        expect(getAutoplayPolicy({ reducedMotion: false, saveData: false, touchFirst: false })).to.equal('auto')
        expect(getAutoplayPolicy({ reducedMotion: true, saveData: false, touchFirst: false })).to.equal('manual')
        expect(getAutoplayPolicy({ reducedMotion: false, saveData: true, touchFirst: false })).to.equal('manual')
        expect(getAutoplayPolicy({ reducedMotion: false, saveData: false, touchFirst: true })).to.equal('manual')
    })

    it('loads the clip only when it is wanted', () => {
        expect(shouldLoadClip(base)).to.equal(true)
        expect(shouldLoadClip({ ...base, inView: false })).to.equal(false)
        expect(shouldLoadClip({ ...base, pageVisible: false })).to.equal(false)
        expect(shouldLoadClip({ ...base, policy: 'unknown' })).to.equal(false)
        expect(shouldLoadClip({ ...base, policy: 'manual' })).to.equal(false)
        expect(shouldLoadClip({ ...base, policy: 'manual', started: true })).to.equal(true)
        expect(shouldLoadClip({ ...base, started: true, inView: false })).to.equal(true)
        expect(shouldLoadClip({ ...base, started: true, failed: true })).to.equal(false)
    })

    it('plays only while visible and not paused by the user', () => {
        expect(shouldPlayClip({ ...base, started: true })).to.equal(true)
        expect(shouldPlayClip({ ...base, started: true, inView: false })).to.equal(false)
        expect(shouldPlayClip({ ...base, started: true, pageVisible: false })).to.equal(false)
        expect(shouldPlayClip({ ...base, started: true, userPaused: true })).to.equal(false)
        expect(shouldPlayClip({ ...base, policy: 'manual' })).to.equal(false)
    })

    it('keeps a tapped clip playing while any part of it is visible', () => {
        const tapped = { ...base, policy: 'manual' as const, started: true, tapped: true }
        expect(shouldPlayClip({ ...tapped, inView: false })).to.equal(true)
        expect(shouldPlayClip({ ...tapped, inView: false, visible: false })).to.equal(false)
        expect(shouldPlayClip({ ...tapped, pageVisible: false })).to.equal(false)
        expect(shouldPlayClip({ ...base, started: true, inView: false, visible: true })).to.equal(false)
    })
})

describe('Feature media and data', () => {
    it('builds poster and clip urls from the base', () => {
        expect(getFeatureMediaUrls('flipper')).to.deep.equal({
            poster: `${DEFAULT_FEATURE_MEDIA_BASE}/flipper.webp`,
            webm: `${DEFAULT_FEATURE_MEDIA_BASE}/flipper.webm`,
            mp4: `${DEFAULT_FEATURE_MEDIA_BASE}/flipper.mp4`
        })
        expect(getFeatureMediaUrls('a b', 'http://localhost:8080/media//').poster).to.equal('http://localhost:8080/media/a%20b.webp')
        expect(formatClipLength(9)).to.equal('0:09')
        expect(formatClipLength(75)).to.equal('1:15')
    })

    it('has unique features with four tier values each', () => {
        const ids = PREMIUM_FEATURES.map(feature => feature.id)
        expect(new Set(ids).size).to.equal(ids.length)
        PREMIUM_FEATURES.forEach(feature => expect(feature.values, feature.id).to.have.length(4))
        expect(PREMIUM_FEATURES.filter(feature => feature.media?.kind === 'clip').map(feature => feature.id)).to.deep.equal([
            'flipper',
            'finders',
            'tasks',
            'history',
            'bazaar',
            'tooltip',
            'chatflips',
            'commands',
            'leaderboard'
        ])
        expect(PREMIUM_FEATURES.filter(feature => feature.media?.kind === 'still').map(feature => feature.id)).to.deep.equal([])
    })

    it('points every comparison clipId at an existing feature', () => {
        const ids = new Set(PREMIUM_FEATURES.map(feature => feature.id))
        COMPARE_GROUPS.forEach(group =>
            group.rows.forEach(row => {
                expect(row.cells, row.label).to.have.length(4)
                if (row.clipId) expect(ids.has(row.clipId), `${row.label} -> ${row.clipId}`).to.equal(true)
            })
        )
        const labels = COMPARE_GROUPS.flatMap(group => group.rows.map(row => row.label))
        expect(new Set(labels).size).to.equal(labels.length)
    })

    it('has one plan card per tier', () => {
        expect(PLAN_CARDS.map(plan => plan.tier)).to.deep.equal([PremiumTier.STARTER, PremiumTier.PREMIUM, PremiumTier.PREMIUM_PLUS])
    })
})

describe('Purchase wizard step count', () => {
    const base = { slotCount: 0, tier: PremiumTier.PREMIUM, tierPreselected: false }

    it('counts every step when the tier is chosen in the wizard', () => {
        expect(getStepDisplay({ ...base, currentStep: 1 })).to.deep.equal({ visible: 1, total: 5 })
        expect(getStepDisplay({ ...base, currentStep: 5 })).to.deep.equal({ visible: 5, total: 5 })
        expect(getStepDisplay({ ...base, tier: PremiumTier.STARTER, currentStep: 4 })).to.deep.equal({ visible: 3, total: 4 })
        expect(getStepDisplay({ ...base, slotCount: 4, currentStep: 5 })).to.deep.equal({ visible: 4, total: 4 })
    })

    it('leaves out the tier step when the tier was picked on a plan card or by link', () => {
        const picked = { ...base, tierPreselected: true }
        expect(getStepDisplay({ ...picked, currentStep: 2 })).to.deep.equal({ visible: 1, total: 4 })
        expect(getStepDisplay({ ...picked, currentStep: 5 })).to.deep.equal({ visible: 4, total: 4 })
        expect(getStepDisplay({ ...picked, tier: PremiumTier.STARTER, currentStep: 2 })).to.deep.equal({ visible: 1, total: 3 })
        expect(getStepDisplay({ ...picked, tier: PremiumTier.STARTER, currentStep: 5 })).to.deep.equal({ visible: 3, total: 3 })
        expect(getStepDisplay({ ...picked, slotCount: 4, currentStep: 5 })).to.deep.equal({ visible: 3, total: 3 })
    })
})

describe('Purchase wizard navigation', () => {
    const start: WizardState = { currentStep: STEP.TIER, tier: null, type: null, slotCount: 0, duration: null }
    const subscription: WizardState = { ...start, tier: PremiumTier.PREMIUM, type: PurchaseType.SUBSCRIPTION }

    /** Starter has no slot packages, and friends always buy at least one slot before the checkout */
    function isReachable(state: WizardState): boolean {
        if (state.tier === PremiumTier.STARTER && (state.showSlots || state.slotCount > 0)) return false
        // only a personal purchase upgraded in place from Starter skips the package step
        if (state.packageSkipped && (state.showSlots || state.slotCount > 0)) return false
        return !(state.showSlots && state.slotCount === 0 && state.currentStep === STEP.PURCHASE)
    }

    it('draws one progress segment per counted step, in line with "Step x of y"', () => {
        for (const tier of [PremiumTier.STARTER, PremiumTier.PREMIUM, PremiumTier.PREMIUM_PLUS])
            for (const slotCount of [0, 1, 4])
                for (const showSlots of [false, true])
                    for (const tierPreselected of [false, true])
                        for (const packageSkipped of [false, true])
                        for (const currentStep of [1, 2, 3, 4, 5]) {
                            const state = { ...start, tier, slotCount, showSlots, tierPreselected, packageSkipped, currentStep }
                            const flow = getStepFlow(state)
                            if (!flow.includes(currentStep) || !isReachable(state)) continue
                            const display = getStepDisplay(state)
                            expect(flow.length, JSON.stringify(state)).to.equal(display.total)
                            expect(flow.indexOf(currentStep) + 1, JSON.stringify(state)).to.equal(display.visible)
                        }
    })

    it('enables Continue only once the step has an answer and follows the skipped steps', () => {
        expect(getNextStep(start)).to.equal(null)
        expect(getNextStep({ ...start, tier: PremiumTier.PREMIUM })).to.equal(STEP.TYPE)
        expect(getNextStep({ ...subscription, type: null, currentStep: STEP.TYPE })).to.equal(null)
        expect(getNextStep({ ...subscription, currentStep: STEP.TYPE })).to.equal(STEP.PACKAGE)
        expect(getNextStep({ ...subscription, tier: PremiumTier.STARTER, currentStep: STEP.TYPE })).to.equal(STEP.DURATION)
        // "Just for me" is preselected for personal purchases, friends have to pick a package
        expect(getNextStep({ ...subscription, currentStep: STEP.PACKAGE })).to.equal(STEP.DURATION)
        expect(getNextStep({ ...subscription, currentStep: STEP.PACKAGE, showSlots: true })).to.equal(null)
        expect(getNextStep({ ...subscription, currentStep: STEP.PACKAGE, slotCount: 4 })).to.equal(STEP.PURCHASE)
        expect(getNextStep({ ...subscription, currentStep: STEP.DURATION })).to.equal(null)
        expect(getNextStep({ ...subscription, currentStep: STEP.DURATION, duration: Duration.YEARLY })).to.equal(STEP.PURCHASE)
        expect(getNextStep({ ...subscription, currentStep: STEP.PURCHASE })).to.equal(null)
    })

    // regression: an upgrade could continue with the active (disabled) tier
    it('continues from the tier step only with a tier the visitor may buy', () => {
        const upgrade = { ...start, isUpgrade: true, currentTier: PremiumTier.PREMIUM_PLUS }
        expect(canSelectTier(PremiumTier.PREMIUM_PLUS, PremiumTier.PREMIUM_PLUS, true)).to.equal(false)
        expect(canSelectTier(PremiumTier.PREMIUM_PLUS, PremiumTier.PREMIUM, true)).to.equal(true)
        expect(canSelectTier(PremiumTier.STARTER, PremiumTier.PREMIUM_PLUS, false)).to.equal(true)
        expect(getNextStep({ ...upgrade, tier: PremiumTier.PREMIUM_PLUS })).to.equal(null)
        expect(getNextStep({ ...upgrade, currentTier: PremiumTier.PREMIUM, tier: PremiumTier.PREMIUM_PLUS })).to.equal(STEP.TYPE)
    })

    // regression: Starter upgraded in place at the checkout grew a package step it never showed
    it('leaves out a package step the visitor skipped', () => {
        const upgraded = { ...subscription, duration: Duration.YEARLY, currentStep: STEP.PURCHASE, packageSkipped: true }
        expect(getStepFlow(upgraded)).to.deep.equal([STEP.TIER, STEP.TYPE, STEP.DURATION, STEP.PURCHASE])
        expect(getSummaryChips(upgraded).map(chip => chip.step)).to.deep.equal([STEP.TYPE, STEP.DURATION])
        expect(getPreviousStep({ ...upgraded, currentStep: STEP.DURATION })).to.equal(STEP.TYPE)
        expect(getNextStep({ ...upgraded, currentStep: STEP.TYPE })).to.equal(STEP.DURATION)
    })

    it('has no Back on the first step and goes back over skipped steps', () => {
        expect(getPreviousStep(start)).to.equal(null)
        expect(getPreviousStep({ ...subscription, currentStep: STEP.TYPE })).to.equal(STEP.TIER)
        expect(getPreviousStep({ ...subscription, currentStep: STEP.PURCHASE, slotCount: 4 })).to.equal(STEP.PACKAGE)
        expect(getPreviousStep({ ...subscription, currentStep: STEP.DURATION, tier: PremiumTier.STARTER })).to.equal(STEP.TYPE)
        expect(getPreviousStep({ ...subscription, currentStep: STEP.PURCHASE, duration: Duration.MONTHLY })).to.equal(STEP.DURATION)
    })

    it('summarises each answered step as a chip that names the step it changes', () => {
        const done = { ...subscription, duration: Duration.QUARTER, currentStep: STEP.PURCHASE }
        expect(getSummaryChips({ ...subscription, currentStep: STEP.TYPE })).to.deep.equal([])
        expect(getSummaryChips(done).map(chip => chip.ariaLabel)).to.deep.equal([
            'Change plan type: Subscription',
            'Change package: Just for me',
            'Change duration: Quarterly'
        ])
        expect(getSummaryChips({ ...done, slotCount: 4 }).map(chip => [chip.step, chip.value])).to.deep.equal([
            [STEP.TYPE, 'Subscription'],
            [STEP.PACKAGE, '4 slots']
        ])
        expect(getSummaryChips({ ...done, tier: PremiumTier.STARTER, type: PurchaseType.COFLCOINS }).map(chip => chip.value)).to.deep.equal([
            'CoflCoins',
            '6 Months'
        ])
    })

    it('titles every step once and keeps the questions as helper lines', () => {
        const context = { isUpgrade: false, currentTier: null, forFriends: false, slotCount: 0, tier: PremiumTier.PREMIUM, type: PurchaseType.COFLCOINS }
        expect(getStepTitle(STEP.TYPE, context)).to.equal('Choose Your Plan Type')
        expect(getStepTitle(STEP.TIER, { ...context, isUpgrade: true, currentTier: PremiumTier.STARTER })).to.equal('Upgrade Your Starter Premium')
        expect(getStepTitle(STEP.PURCHASE, { ...context, isUpgrade: true })).to.equal('Complete Upgrade')
        expect(getStepTitle(STEP.PURCHASE, { ...context, isUpgrade: true, currentTier: PremiumTier.PREMIUM })).to.equal('Complete Purchase')
        expect(getStepHelper(STEP.DURATION, context)).to.contain('How long would you like Premium?')
        expect(getStepHelper(STEP.PURCHASE, context)).to.equal(null)
    })

    it('advances on pointer clicks only; keyboard activation and arrow keys dispatch clicks with detail 0', () => {
        expect(isPointerClick({ detail: 1 })).to.equal(true)
        expect(isPointerClick({ detail: 2 })).to.equal(true)
        expect(isPointerClick({ detail: 0 })).to.equal(false)
    })
})

describe('Money formatting', () => {
    // regression: the checkout total read "421.5 Euro"
    it('shows the currency with the amount and always two decimals', () => {
        const total = formatMoney(421.5, 'EUR')
        expect(total).to.equal(new Intl.NumberFormat(undefined, { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(421.5))
        expect(total).to.match(/421[.,]50/).and.to.contain('€')
        expect(formatMoney(10, 'USD')).to.match(/10[.,]00/).and.to.contain('$')
    })

    it('falls back to the code for an unknown currency', () => {
        expect(formatMoney(9.5, 'Euro')).to.equal('9.50 Euro')
    })
})

describe('Plan cards', () => {
    const lemonSqueezy = { exact: false, net: false, continues: false, settled: true }
    const direct = { exact: true, net: false, continues: true, settled: true }

    const net = { exact: false, net: true, continues: true, settled: true }
    // the live Blackweek sale of Germany (and, with Stripe only, the US)
    const blackweek = {
        code: 'GTA6',
        name: 'Blackweek sale',
        amountType: 'percent',
        amount: 25,
        periodAmounts: { 4: 25, 13: 40, 52: 50 },
        duration: 'once',
        startsAt: '2026-11-19T23:00:00Z',
        expiresAt: '2026-11-30T22:59:59Z',
        providers: ['stripe', 'paypal']
    }

    /** a card price as one line, a struck price as "(instead of …)" */
    function text(price: PlanPrice): string {
        const original = price.original ? ` (instead of ${price.original})` : ''
        const badge = price.badge ? ` [${price.badge}]` : ''
        return `${price.amount}${original} ${price.unit}${badge} | ${getPlanNoteText(price.note)}`
    }

    it('shows prices from the pricing utilities, with VAT for known countries', () => {
        // Starter is sold for 52 weeks only (payment fees)
        expect(getPlanPrice(PremiumTier.STARTER, 'US', lemonSqueezy)).to.deep.equal({
            amount: '€16.69',
            original: null,
            badge: null,
            unit: '+ VAT every 52 weeks',
            note: ['Billed every 52 weeks only, because of payment fees']
        })
        // an unknown country is not priced as the US: before VAT, and it says so
        expect(text(getPlanPrice(PremiumTier.PREMIUM, undefined, lemonSqueezy))).to.equal(
            '€9.69 every 4 weeks, plus VAT where applicable | Or €27.69 every 13 weeks, €96.69 every 52 weeks'
        )
        expect(text(getPlanPrice(PremiumTier.PREMIUM_PLUS, undefined, lemonSqueezy))).to.equal(
            '€354.20 every 52 weeks, plus VAT where applicable | Or €99.69 every 13 weeks, €35.69 every 4 weeks'
        )
        expect(getPlanPrice(PremiumTier.PREMIUM, 'DE', lemonSqueezy)).to.deep.include({ amount: '€11.53', unit: 'every 4 weeks' })
        // card and PayPal: the 52 week plan continues every 4 weeks, also the default before the offer is known
        expect(text(getPlanPrice(PremiumTier.PREMIUM_PLUS, 'US', direct))).to.equal(
            '€354.20 for the first 52 weeks | then €35.69 every 4 weeks until cancelled. Or €99.69 for the first 13 weeks, then €35.69 every 4 weeks, or €35.69 every 4 weeks from the start. Cancel anytime'
        )
        expect(getPlanNoteText(getPlanPrice(PremiumTier.PREMIUM_PLUS).note)).to.equal(
            'then every 4 weeks until cancelled. Or €99.69 for the first 13 weeks, then every 4 weeks, or €35.69 every 4 weeks from the start. Cancel anytime'
        )
    })

    // regression: the Premium+ headline was the 52-week price divided by 13 ("€32.43 per 4 weeks"), a price nobody is charged
    it('heads every card with a price that is charged, exact for a German direct checkout', () => {
        expect(text(getPlanPrice(PremiumTier.STARTER, 'DE', direct))).to.equal('€19.86 for the first 52 weeks | then €3.20 every 4 weeks until cancelled. Cancel anytime')
        expect(text(getPlanPrice(PremiumTier.PREMIUM, 'DE', direct))).to.equal(
            '€11.53 every 4 weeks | Or €32.95 for the first 13 weeks or €115.06 for the first 52 weeks, then €11.53 every 4 weeks until cancelled. Cancel anytime'
        )
        expect(text(getPlanPrice(PremiumTier.PREMIUM_PLUS, 'DE', direct))).to.equal(
            '€421.50 for the first 52 weeks | then €42.47 every 4 weeks until cancelled. Or €118.63 for the first 13 weeks, then €42.47 every 4 weeks, or €42.47 every 4 weeks from the start. Cancel anytime'
        )
    })

    it('strikes the regular price of every period during a promotion, with the backend rounding', () => {
        expect(getPlanPrice(PremiumTier.STARTER, 'DE', direct, blackweek)).to.deep.include({ amount: '€9.92', original: '€19.86', badge: '-50%', unit: 'for the first 52 weeks' })
        expect(text(getPlanPrice(PremiumTier.STARTER, 'DE', direct, blackweek))).to.contain('| then €3.20 every 4 weeks until cancelled.')
        expect(text(getPlanPrice(PremiumTier.PREMIUM, 'DE', direct, blackweek))).to.equal(
            '€8.65 (instead of €11.53) for the first 4 weeks [-25%] | then €11.53 every 4 weeks until cancelled. Or €19.77 (instead of €32.95) for the first 13 weeks (-40%) or €57.52 (instead of €115.06) for the first 52 weeks (-50%), then €11.53 every 4 weeks. Cancel anytime'
        )
        expect(text(getPlanPrice(PremiumTier.PREMIUM_PLUS, 'DE', direct, blackweek))).to.equal(
            '€210.75 (instead of €421.50) for the first 52 weeks [-50%] | then €42.47 every 4 weeks until cancelled. Or €71.17 (instead of €118.63) for the first 13 weeks (-40%), or €31.86 (instead of €42.47) for the first 4 weeks (-25%), then €42.47 every 4 weeks. Cancel anytime'
        )
    })

    it('shows net sale prices for Managed Payments and exact ones for the US, where no tax is added', () => {
        expect(text(getPlanPrice(PremiumTier.PREMIUM, 'BR', net, blackweek))).to.equal(
            '€7.27 (instead of €9.69) + tax for the first 4 weeks [-25%] | then €9.69 every 4 weeks until cancelled. Or €16.61 (instead of €27.69) for the first 13 weeks (-40%) or €48.34 (instead of €96.69) for the first 52 weeks (-50%), then €9.69 every 4 weeks. Cancel anytime'
        )
        expect(getPlanPrice(PremiumTier.PREMIUM, 'US', direct, blackweek)).to.deep.include({ amount: '€7.27', original: '€9.69', badge: '-25%', unit: 'for the first 4 weeks' })
    })

    it('leaves the promotion out where the charge is not known exactly', () => {
        expect(getPlanPrice(PremiumTier.PREMIUM, 'DE', lemonSqueezy, blackweek)).to.deep.include({ amount: '€11.53', original: null, badge: null })
        expect(getPlanPrice(PremiumTier.PREMIUM, 'DE', undefined, blackweek)).to.deep.include({ amount: '€11.53', original: null, badge: null })
        expect(getPlanNoteText(getPlanPrice(PremiumTier.PREMIUM, 'DE', lemonSqueezy, blackweek).note)).not.to.contain('instead of')
    })

    it('discounts the renewal too when the promotion covers every payment', () => {
        const everyPayment = { ...blackweek, duration: 'forever' }
        // the 4-week plan simply repeats at the sale price, so it is not "for the first 4 weeks"
        expect(text(getPlanPrice(PremiumTier.PREMIUM, 'DE', direct, everyPayment))).to.equal(
            '€8.65 (instead of €11.53) every 4 weeks [-25%] | Or €19.77 (instead of €32.95) for the first 13 weeks (-40%) or €57.52 (instead of €115.06) for the first 52 weeks (-50%), then €8.65 every 4 weeks until cancelled. Cancel anytime'
        )
    })

    it('names the best percent and the end of a promotion for the sale banners', () => {
        expect(getMaxPercent(blackweek)).to.equal(50)
        expect(describeBestAmount(blackweek)).to.equal('up to 50% off')
        expect(describeBestAmount({ ...blackweek, amountType: 'fixed', amount: 500, periodAmounts: null })).to.equal('€5.00 off')
        expect(getMaxPercent({ ...blackweek, amountType: 'fixed' })).to.equal(0)
        expect(formatPromotionEnd(blackweek.expiresAt, 'Europe/Berlin')).to.match(/^November 30, 11:59\sPM GMT\+1$/)
        expect(formatPromotionEnd('2026-11-30T23:00:00Z', 'Europe/Berlin')).to.equal('November 30')
        expect(describePromotionEnd('2026-11-30T23:00:00Z', 'Europe/Berlin')).to.equal('Offer runs through November 30.')
        expect(describePromotionEnd(blackweek.expiresAt, 'Europe/Berlin')).to.match(/^Offer ends November 30, 11:59\sPM GMT\+1\.$/)
        expect(formatPromotionEnd(null)).to.equal(null)
    })

    // regression: the end time could use U+202F before AM/PM on one side and a plain space on the other (hydration mismatch)
    it('formats the end time with plain spaces only', () => {
        expect(formatPromotionEnd(blackweek.expiresAt, 'Europe/Berlin')).not.to.match(/[\u202f\u00a0]/)
    })

    describe('weighing a code from the link against the sale', () => {
        const both = ['stripe', 'paypal'] as ('stripe' | 'paypal')[]
        const weighing = { promotion: blackweek, planPrice: 9.69, providers: both }
        const percent = (amounts: Record<number, number>, duration = 'once') => ({
            code: 'LINK',
            amount: Math.max(...Object.values(amounts)),
            amountType: 'percent',
            periodAmounts: amounts,
            duration
        })
        const fixed = (cents: number) => ({ code: 'LINK', amount: cents, amountType: 'fixed', duration: 'once' })

        it('takes what a code saves on one payment like the payment backend', () => {
            // 25% of €9.69: 969 - round_half_even(726.75) = 242 cents
            expect(getPaymentSavingCents(blackweek, 9.69, 4)).to.equal(242)
            expect(getPaymentSavingCents(fixed(200), 9.69, 4)).to.equal(200)
            // a fixed amount never saves more than the price
            expect(getPaymentSavingCents(fixed(5000), 9.69, 4)).to.equal(969)
            expect(getPaymentSavingCents(blackweek, null, 4)).to.equal(null)
        })

        it('keeps the code where it saves at least as much on this payment', () => {
            expect(weighLinkCode(percent({ 4: 10, 13: 10, 52: 60 }), true, 4, weighing)).to.equal('saving')
            expect(weighLinkCode(percent({ 4: 10, 13: 10, 52: 60 }), true, 52, weighing)).to.equal('link')
            expect(weighLinkCode(percent({ 4: 25, 13: 25, 52: 25 }), true, 4, weighing)).to.equal('link')
            // fixed amounts by the price: €2.00 < €2.42, €5.00 > €2.42
            expect(weighLinkCode(fixed(200), true, 4, weighing)).to.equal('saving')
            expect(weighLinkCode(fixed(500), true, 4, weighing)).to.equal('link')
            // without a price only percent codes are compared; a fixed amount is kept
            expect(weighLinkCode(fixed(200), true, 4, { ...weighing, planPrice: null })).to.equal('link')
            expect(weighLinkCode(percent({ 4: 10, 13: 10, 52: 10 }), true, 4, { ...weighing, planPrice: null })).to.equal('saving')
        })

        it('replaces a code that does not cover the period, only where every provider honours the sale', () => {
            expect(weighLinkCode(percent({ 4: 0, 13: 0, 52: 30 }), false, 4, weighing)).to.equal('period')
            const stripeOnlySale = { ...blackweek, providers: ['paypal'] }
            expect(isHonouredByAll(stripeOnlySale, both)).to.equal(false)
            expect(isHonouredByAll(stripeOnlySale, ['paypal'])).to.equal(true)
            expect(isHonouredByAll({ ...blackweek, providers: null }, both)).to.equal(true)
            expect(weighLinkCode(percent({ 4: 10, 13: 10, 52: 10 }), true, 4, { ...weighing, promotion: stripeOnlySale })).to.equal('link')
            expect(weighLinkCode(percent({ 4: 0, 13: 0, 52: 30 }), false, 4, { ...weighing, promotion: stripeOnlySale })).to.equal('link')
            // the sale's own code is not weighed against itself
            expect(weighLinkCode({ ...percent({ 4: 25 }), code: 'gta6' }, true, 4, weighing)).to.equal('link')
        })

        it('names a code\'s terms for the period', () => {
            expect(describeCodeTerms(blackweek, 52)).to.equal('50% off your first payment')
            expect(describeCodeTerms(percent({ 4: 10, 13: 10, 52: 10 }, 'forever'), 4)).to.equal('10% off every payment')
            expect(describeCodeTerms(fixed(500), 4)).to.equal('€5.00 off your first payment')
        })
    })

    it('sends visitors to the step that blocks the purchase', () => {
        expect(getPurchaseTarget({ isLoggedIn: false, isLoading: false, canPurchase: false }, 'buyPremium')).to.equal('premium-sign-in')
        expect(getPurchaseTarget({ isLoggedIn: true, isLoading: true, canPurchase: false }, 'buyPremium')).to.equal('premium-sign-in')
        expect(getPurchaseTarget({ isLoggedIn: true, isLoading: false, canPurchase: false }, 'buyPremium')).to.equal('terms-acceptance')
        expect(getPurchaseTarget({ isLoggedIn: true, isLoading: false, canPurchase: true }, 'buyPremium')).to.equal('buyPremium')
        expect(getPurchaseTarget({ isLoggedIn: true, isLoading: false, canPurchase: true }, 'coflcoins-purchase')).to.equal('coflcoins-purchase')
    })

    it('opens the sign-in for a signed out visitor, waits during a running login and runs otherwise', () => {
        expect(getSignInStep({ isLoggedIn: false, isSigningIn: false })).to.equal('prompt')
        expect(getSignInStep({ isLoggedIn: false, isSigningIn: true })).to.equal('wait')
        expect(getSignInStep({ isLoggedIn: true, isSigningIn: true })).to.equal('wait')
        expect(getSignInStep({ isLoggedIn: true, isSigningIn: false })).to.equal('run')
    })

    it('continues an action after the sign-in at its purchase block, or at the step that blocks it', () => {
        const ready = { isLoggedIn: true, isLoading: false, canPurchase: true }
        const needsTerms = { ...ready, canPurchase: false }
        expect(getSignInActionTarget('plan', ready)).to.equal('buyPremium')
        expect(getSignInActionTarget('slots', ready)).to.equal('buyPremium')
        expect(getSignInActionTarget('coflcoins', ready)).to.equal('coflcoins-purchase')
        for (const action of ['plan', 'slots', 'coflcoins'] as const) {
            expect(getSignInActionTarget(action, needsTerms)).to.equal('terms-acceptance')
            expect(getSignInActionTarget(action, { ...ready, isLoggedIn: false })).to.equal('premium-sign-in')
        }
    })
})

describe('Community quotes', () => {
    it('formats the day with a fixed English month table, independent of locale and timezone', () => {
        expect(formatQuoteDate('2026-07-15')).to.equal('15 Jul 2026')
        expect(formatQuoteDate('2025-02-16')).to.equal('16 Feb 2025')
        expect(formatQuoteDate('2024-12-01')).to.equal('1 Dec 2024')
        expect(formatQuoteDate('2024-01-31')).to.equal('31 Jan 2024')
    })

    it('shows anything that is not a YYYY-MM-DD day as it is', () => {
        expect(formatQuoteDate('2024-13-01')).to.equal('2024-13-01')
        expect(formatQuoteDate('15.07.2026')).to.equal('15.07.2026')
        expect(formatQuoteDate('')).to.equal('')
    })

    it('shows a generic author with a neutral avatar when the quote has no name', () => {
        expect(ANONYMOUS_AUTHOR).to.equal('SkyCofl user')
        expect(getQuoteAuthor({ date: '2026-07-15', text: 'prem+ best' })).to.deep.equal({ name: 'SkyCofl user' })
        expect(getQuoteAuthor({ name: '  ', date: '2026-07-15', text: 'prem+ best' })).to.deep.equal({ name: 'SkyCofl user' })
        expect(getQuoteAuthor({ name: 'strikeangles', date: '2025-02-16', text: 'prem+ is awesome' })).to.deep.equal({ name: 'strikeangles', initial: 'S' })
    })

    it('lists the quotes newest first', () => {
        const days = COMMUNITY_QUOTES.map(quote => quote.date)
        expect(days).to.deep.equal([...days].sort().reverse())
    })
})

describe('Preview popover placement', () => {
    const viewport = { width: 1200, height: 800 }

    function rect(left: number, top: number, height = 44): DOMRect {
        return { left, top, bottom: top + height, right: left + 300, width: 300, height, x: left, y: top, toJSON: () => ({}) } as DOMRect
    }

    it('opens below the row when there is room, above otherwise', () => {
        expect(placePopover(rect(100, 100), 280, viewport)).to.deep.equal({ left: 108, top: 148, width: 340, above: false })
        const above = placePopover(rect(100, 700), 280, viewport)
        expect(above.above).to.equal(true)
        expect(above.top).to.equal(700 - 4 - 280)
    })

    it('stays inside narrow viewports', () => {
        const phone = placePopover(rect(200, 100), 280, { width: 360, height: 640 })
        expect(phone.width).to.equal(340)
        expect(phone.left).to.equal(12)
        const small = placePopover(rect(200, 100), 280, { width: 320, height: 640 })
        expect(small.width).to.equal(304)
        expect(small.left).to.equal(8)
    })
})
