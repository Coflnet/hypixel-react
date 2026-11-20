import { useEffect, useRef, useState } from 'react'
import { getApiDiscountCode } from '../api/_generated/skyApi'
import type { ValidatedDiscount } from '../api/_generated/skyApi.schemas'
import {
    LinkCodeChoice,
    LinkWeighing,
    PaymentProvider,
    getPeriodPercent,
    hasPeriodAmounts,
    isPercentDiscount,
    weighLinkCode
} from '../utils/SubscriptionCheckout'

const YEARLY_ONLY_ERROR = 'This discount code is only valid for yearly billing'
const PERIOD_ERROR = 'This discount code does not apply to the selected billing period'
const YEARLY_WEEKS = 52
/** a check that does not answer gives up, so the code field and the payment buttons do not stay blocked */
const CHECK_TIMEOUT_MS = 8000
const NO_WEIGHING: LinkWeighing = { promotion: null, planPrice: null, providers: [] }

interface Options {
    /** the billing period in weeks (4, 13 or 52); codes that do not cover it are held back. Undefined skips the check */
    weeks?: number
    /** check the prefilled code right away instead of waiting for the visitor to press apply */
    validateInitial?: boolean
    /** a code to apply on its own (the running promotion) as long as the visitor did not enter or clear one */
    autoCode?: string | null
    /** the promotion (`autoCode`), the plan price and the providers a code from the link is weighed against, see weighLinkCode */
    weighing?: LinkWeighing
    /** the checkout the code is for; a changed provider checks the entered code again */
    isSubscription?: boolean
    provider?: PaymentProvider
}

/** calls `onChange` after a render in which `value` differs from the one before; on mount when it differs from `initial` */
function useValueChange<T>(value: T, onChange: (previous: T) => void, initial: T = value) {
    const previous = useRef(initial)
    const callback = useRef(onChange)
    callback.current = onChange
    useEffect(() => {
        if (Object.is(previous.current, value)) return
        const before = previous.current
        previous.current = value
        callback.current(before)
    }, [value])
}

/** state that handlers and effects can also read right after setting it, before the next render */
function useStateRef<T>(initial: T): [T, { readonly current: T }, (value: T) => void] {
    const [state, setState] = useState(initial)
    const ref = useRef(initial)
    function set(value: T) {
        ref.current = value
        setState(value)
    }
    return [state, ref, set]
}

/** runs once after mount */
function useMountAction(action: () => void) {
    const callback = useRef(action)
    useEffect(() => callback.current(), [])
}

/** whether the code works for yearly billing, so the visitor can be offered to switch */
function worksYearly(discount: ValidatedDiscount): boolean {
    if (hasPeriodAmounts(discount)) return getPeriodPercent(discount, YEARLY_WEEKS) > 0
    return isLegacyYearlyOnly(discount)
}

/** codes without per-period amounts (Lemon Squeezy) only say "yearly" in their name */
function isLegacyYearlyOnly(discount: ValidatedDiscount): boolean {
    return (discount.name || '').toLowerCase().includes('yearly')
}

/** why the code cannot be used for a billing period of `weeks`, null when it can */
function getPeriodError(discount: ValidatedDiscount, weeks: number | undefined): string | null {
    if (weeks === undefined) return null
    const fits = hasPeriodAmounts(discount)
        ? !isPercentDiscount(discount) || getPeriodPercent(discount, weeks) > 0
        : weeks === YEARLY_WEEKS || !isLegacyYearlyOnly(discount)
    if (fits) return null
    return worksYearly(discount) ? YEARLY_ONLY_ERROR : PERIOD_ERROR
}

function isSameCode(a: string, b: string): boolean {
    return a.trim().toUpperCase() === b.trim().toUpperCase()
}

/** why the promotion stands in for the code from the link (see weighLinkCode), with the code for the note that says so */
export type LinkCodeReplacement = { code: string; reason: Exclude<LinkCodeChoice, 'link'>; link: ValidatedDiscount }

function getWeighingKey(weighing: LinkWeighing | undefined): string {
    if (!weighing) return ''
    return `${weighing.promotion?.code ?? ''}|${weighing.planPrice ?? ''}|${weighing.providers.join(',')}`
}

/**
 * Validation state of a discount code typed in (or prefilled) at checkout; `initialCode` only prefills the input, call `validate`
 * to check it. `autoCode` (the running promotion) is filled in while the visitor did not enter or clear a code, and in place of
 * an initial code (e.g. from the link) that turns out invalid, or that the promotion beats (`weighing`, see weighLinkCode;
 * `replacedLinkCode` says so). The choice is made again when the period, the promotion, the price or the providers change.
 */
export default function useDiscountCode(initialCode?: string | null, { weeks, validateInitial, autoCode, weighing, isSubscription, provider }: Options = {}) {
    // refs alongside the state: a handler or effect right after a change reads the new value, not the render's
    const [code, codeRef, setCode] = useStateRef(initialCode || '')
    const [validated, validatedRef, setValidated] = useStateRef<ValidatedDiscount | null>(null)
    const [pendingYearly, setPendingYearly] = useState<ValidatedDiscount | null>(null)
    const [validating, validatingRef, setValidating] = useStateRef(false)
    const [error, errorRef, setError] = useStateRef<string | null>(null)
    // the code the latest check is for, and the provider it was checked for
    const checking = useRef('')
    const checkedFor = useRef<PaymentProvider | undefined>(undefined)
    // the visitor entered, applied or cleared a code: automatic codes no longer replace it
    // an empty initial code is the buyer's "cleared" carried over from another checkout: the promotion stays out too
    const touched = useRef(initialCode === '')
    // the code the checkout opened with holds the promotion back until it turns out invalid; while valid it is weighed against it
    const holdsInitialCode = useRef(!!initialCode?.trim())
    // the code from the link once it validated, kept to weigh it against the promotion again for another period
    const linkDiscount = useRef<ValidatedDiscount | null>(null)
    const [replacedLinkCode, setReplacedLinkCode] = useState<LinkCodeReplacement | null>(null)
    const latestRequest = useRef(0)
    // only the latest background re-check of the link code may decide (provider changes can overlap)
    const latestRecheck = useRef(0)
    // read after a request returns: the options and closures of the latest render
    const latest = useRef({ autoCode, check, chooseLinkOrPromotion })
    latest.current = { autoCode, check, chooseLinkOrPromotion }

    function reject(message: string) {
        setError(message)
        setValidated(null)
    }

    function accept(discount: ValidatedDiscount) {
        const periodError = getPeriodError(discount, weeks)
        if (periodError) {
            // kept so the visitor can opt in to yearly billing
            setPendingYearly(worksYearly(discount) ? discount : null)
            reject(periodError)
            return
        }
        setPendingYearly(null)
        setValidated(discount)
        setError(null)
    }

    async function check(value: string) {
        const request = ++latestRequest.current
        checking.current = value
        checkedFor.current = provider
        setValidating(true)
        setError(null)
        setValidated(null)
        try {
            const response = await fetchCode(value)
            if (request !== latestRequest.current) return
            if (response.status !== 200 || !response.data) return reject('Could not validate discount code')
            if (!response.data.isValid) return rejectInvalid(value)
            if (isHeldLinkCode(value)) return keepLinkDiscount(response.data)
            accept(response.data)
        } catch (e) {
            if (request !== latestRequest.current) return
            console.error('Error validating discount code:', e)
            reject('Failed to validate discount code. Please try again.')
        } finally {
            if (request === latestRequest.current) setValidating(false)
        }
    }

    async function fetchCode(value: string) {
        const params = isSubscription || provider ? { isSubscription, provider } : undefined
        // AbortController + setTimeout instead of AbortSignal.timeout, which older Safari/Chrome lack
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS)
        try {
            return await getApiDiscountCode(value, params, { signal: controller.signal })
        } finally {
            clearTimeout(timer)
        }
    }

    /** checks the link's code for another provider in the background while the promotion stands in for it */
    async function recheckLinkCode() {
        const recheck = ++latestRecheck.current
        try {
            const response = await fetchCode((initialCode || '').trim())
            if (recheck !== latestRecheck.current) return
            if (response.status === 200 && response.data?.isValid) return keepLinkDiscount(response.data)
        } catch {
            // not answered: the promotion standing in for it stays
            if (recheck !== latestRecheck.current) return
        }
        forgetLinkCode()
    }

    function isHeldLinkCode(value: string): boolean {
        return !touched.current && holdsInitialCode.current && isSameCode(value, initialCode || '')
    }

    function keepLinkDiscount(discount: ValidatedDiscount) {
        linkDiscount.current = discount
        latest.current.chooseLinkOrPromotion(true)
    }

    /**
     * The code from the link, unless the promotion stands in for it (see weighLinkCode).
     * `answered`: called with the answer of the link code's own check (which still counts as running).
     */
    function chooseLinkOrPromotion(answered = false) {
        const link = linkDiscount.current
        if (!link || touched.current || !holdsInitialCode.current) return
        const choice = weighLinkCode(link, !getPeriodError(link, weeks), weeks, weighing ?? NO_WEIGHING)
        if (choice !== 'link' && autoCode) return applyPromotionForLink(link, autoCode, choice)
        applyLinkCode(link, answered)
    }

    function applyPromotionForLink(link: ValidatedDiscount, promotionCode: string, reason: Exclude<LinkCodeChoice, 'link'>) {
        setReplacedLinkCode({ code: link.code || (initialCode || '').trim(), reason, link })
        setPendingYearly(null)
        // one check of the promotion: none again while it is applied or being checked
        if (validatedRef.current?.code && isSameCode(validatedRef.current.code, promotionCode)) return
        if (validatingRef.current && isSameCode(checking.current, promotionCode)) return
        applyAutoCode(promotionCode)
    }

    function applyLinkCode(link: ValidatedDiscount, answered: boolean) {
        setReplacedLinkCode(null)
        // a check of the link code still running (e.g. for the provider) decides again when it answers
        if (!answered && validatingRef.current && isSameCode(checking.current, initialCode || '')) return
        reset((initialCode || '').trim())
        accept(link)
    }

    function rejectInvalid(value: string) {
        reject('This discount code is not valid')
        // e.g. a Lemon Squeezy code from the link at a Stripe checkout: the promotion applies instead
        if (touched.current || !holdsInitialCode.current || !isSameCode(value, initialCode || '')) return
        holdsInitialCode.current = false
        const { autoCode: promotionCode, check: checkLatest } = latest.current
        if (promotionCode) applyAutoCode(promotionCode, checkLatest)
    }

    function applyAutoCode(value: string, checkCode = check) {
        setCode(value)
        void checkCode(value)
    }

    function validate(value = code) {
        touched.current = true
        setReplacedLinkCode(null)
        if (!value.trim()) return setError('Please enter a discount code')
        return check(value.trim())
    }

    function reset(value: string) {
        latestRequest.current++
        setCode(value)
        setValidated(null)
        setPendingYearly(null)
        setValidating(false)
        setError(null)
    }

    useMountAction(() => {
        // only the code the checkout opened with is checked on its own
        if (validateInitial && initialCode) void check(initialCode.trim())
    })

    // one path for the promotion, the period, the price and the providers: a promotion that arrives with its percent is checked once.
    // A promotion already known when the checkout opens (cached) is applied right away.
    const previousAutoCode = useRef<string | null>(null)
    const weighingKey = `${weeks}|${getWeighingKey(weighing)}`
    useValueChange(`${autoCode ?? ''}|${weighingKey}`, onPromotionChange, `|${weighingKey}`)

    function onPromotionChange() {
        const previous = previousAutoCode.current
        previousAutoCode.current = autoCode ?? null
        if (!autoCode && previous) return onPromotionEnded(previous)
        if (linkDiscount.current && holdsInitialCode.current) return chooseLinkOrPromotion()
        if (autoCode && autoCode !== previous && !touched.current && !holdsInitialCode.current) applyAutoCode(autoCode)
    }

    // the promotion ended or does not apply any more (another country): its code goes too, even when applied by hand or carried
    // into this checkout as its code (an upgrade), so the expired code is not accepted again
    function onPromotionEnded(previous: string) {
        if (isSameCode(initialCode || '', previous)) forgetLinkCode()
        if (linkDiscount.current && holdsInitialCode.current) return chooseLinkOrPromotion()
        if (isSameCode(codeRef.current, previous)) reset('')
    }

    // also while a check for the previous provider is still running, its answer would be for the wrong checkout
    useValueChange(provider, () => {
        const current = codeRef.current.trim()
        // the link code was checked for the previous provider only: weighed again once it is checked for this one
        if (linkDiscount.current && holdsInitialCode.current && !isSameCode(current, initialCode || '')) void recheckLinkCode()
        // a check started in this render (e.g. the promotion arriving with the providers) is already for this provider
        if (checkedFor.current === provider) return
        if (current && (validatedRef.current || errorRef.current || validatingRef.current)) void check(current)
    })

    function forgetLinkCode() {
        linkDiscount.current = null
        holdsInitialCode.current = false
        setReplacedLinkCode(null)
    }

    function changeCode(value: string) {
        touched.current = true
        setReplacedLinkCode(null)
        reset(value)
    }

    function clear() {
        touched.current = true
        setReplacedLinkCode(null)
        reset('')
    }

    function applyPendingYearly() {
        setValidated(pendingYearly)
        setPendingYearly(null)
        setError(null)
    }

    /** the buyer entered, applied or cleared a code (or arrived with a cleared one): automatic codes no longer apply */
    const isTouched = () => touched.current
    return { code, validated, pendingYearly, validating, error, replacedLinkCode, validate, changeCode, clear, applyPendingYearly, isTouched }
}

export type DiscountCodeState = ReturnType<typeof useDiscountCode>
