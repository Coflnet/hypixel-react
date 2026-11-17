import { useEffect, useRef, useState } from 'react'
import { getApiDiscountCode } from '../api/_generated/skyApi'
import type { ValidatedDiscount } from '../api/_generated/skyApi.schemas'
import { PaymentProvider, getPeriodPercent, hasPeriodAmounts, isPercentDiscount } from '../utils/SubscriptionCheckout'

const YEARLY_ONLY_ERROR = 'This discount code is only valid for yearly billing'
const PERIOD_ERROR = 'This discount code does not apply to the selected billing period'
const YEARLY_WEEKS = 52

interface Options {
    /** the billing period in weeks (4, 13 or 52); codes that do not cover it are held back. Undefined skips the check */
    weeks?: number
    /** check the prefilled code right away instead of waiting for the visitor to press apply */
    validateInitial?: boolean
    /** a code to apply on its own (the running promotion) as long as the visitor did not enter or clear one */
    autoCode?: string | null
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

/**
 * Validation state of a discount code typed in (or prefilled) at checkout; `initialCode` only prefills the input, call `validate`
 * to check it. `autoCode` (the running promotion) is filled in while the visitor did not enter or clear a code, and in place of
 * an initial code (e.g. from the link) that turns out invalid.
 */
export default function useDiscountCode(initialCode?: string | null, { weeks, validateInitial, autoCode, isSubscription, provider }: Options = {}) {
    const [code, setCode] = useState(initialCode || '')
    const [validated, setValidated] = useState<ValidatedDiscount | null>(null)
    const [pendingYearly, setPendingYearly] = useState<ValidatedDiscount | null>(null)
    const [validating, setValidating] = useState(false)
    const [error, setError] = useState<string | null>(null)
    // the visitor entered, applied or cleared a code: automatic codes no longer replace it
    const touched = useRef(false)
    // the code the checkout opened with holds the promotion back until it turns out invalid
    const holdsInitialCode = useRef(!!initialCode?.trim())
    const latestRequest = useRef(0)
    // read after a request returns: the options and closures of the latest render
    const latest = useRef({ autoCode, check })
    latest.current = { autoCode, check }

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
        setValidating(true)
        setError(null)
        setValidated(null)
        try {
            const response = await getApiDiscountCode(value, isSubscription || provider ? { isSubscription, provider } : undefined)
            if (request !== latestRequest.current) return
            if (response.status !== 200 || !response.data) return reject('Could not validate discount code')
            if (!response.data.isValid) return rejectInvalid(value)
            accept(response.data)
        } catch (e) {
            if (request !== latestRequest.current) return
            console.error('Error validating discount code:', e)
            reject('Failed to validate discount code. Please try again.')
        } finally {
            if (request === latestRequest.current) setValidating(false)
        }
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

    // a promotion already known when the checkout opens (cached) is applied right away
    useValueChange(autoCode ?? null, previous => {
        if (!autoCode) return dropAutoCode(previous)
        if (!touched.current && !holdsInitialCode.current) applyAutoCode(autoCode)
    }, null)

    // the promotion ended or does not apply any more (another country): its code goes too, even when applied by hand
    function dropAutoCode(previous: string | null) {
        if (previous && isSameCode(code, previous)) reset('')
    }

    // also while a check for the previous provider is still running, its answer would be for the wrong checkout
    useValueChange(provider, () => {
        if (code.trim() && (validated || error || validating)) void check(code.trim())
    })

    function changeCode(value: string) {
        touched.current = true
        reset(value)
    }

    function clear() {
        touched.current = true
        reset('')
    }

    function applyPendingYearly() {
        setValidated(pendingYearly)
        setPendingYearly(null)
        setError(null)
    }

    return { code, validated, pendingYearly, validating, error, validate, changeCode, clear, applyPendingYearly }
}

export type DiscountCodeState = ReturnType<typeof useDiscountCode>
