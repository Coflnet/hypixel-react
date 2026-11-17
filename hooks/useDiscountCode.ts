import { useEffect, useState } from 'react'
import { getApiDiscountCode } from '../api/_generated/skyApi'
import type { ValidatedDiscount } from '../api/_generated/skyApi.schemas'

const YEARLY_ONLY_ERROR = 'This discount code is only valid for yearly billing'

interface Options {
    /** false while a billing period shorter than a year is selected (or the product only has such periods), yearly-only codes are then held back */
    isYearly?: boolean
    /** check the prefilled code right away instead of waiting for the visitor to press apply */
    validateInitial?: boolean
}

/** validation state of a discount code typed in (or prefilled) at checkout; `initialCode` only prefills the input, call `validate` to check it */
export default function useDiscountCode(initialCode?: string | null, { isYearly, validateInitial }: Options = {}) {
    const [code, setCode] = useState(initialCode || '')
    const [validated, setValidated] = useState<ValidatedDiscount | null>(null)
    const [pendingYearly, setPendingYearly] = useState<ValidatedDiscount | null>(null)
    const [validating, setValidating] = useState(false)
    const [error, setError] = useState<string | null>(null)

    function reject(message: string) {
        setError(message)
        setValidated(null)
    }

    function accept(discount: ValidatedDiscount) {
        const yearlyOnly = (discount.name || '').toLowerCase().includes('yearly')
        if (yearlyOnly && isYearly === false) {
            // kept so the visitor can opt in to yearly billing
            setPendingYearly(discount)
            reject(YEARLY_ONLY_ERROR)
            return
        }
        setPendingYearly(null)
        setValidated(discount)
        setError(null)
    }

    async function validate(value = code) {
        if (!value.trim()) return setError('Please enter a discount code')
        setValidating(true)
        setError(null)
        setValidated(null)
        try {
            const response = await getApiDiscountCode(value.trim())
            if (response.status !== 200 || !response.data) return reject('Could not validate discount code')
            if (!response.data.isValid) return reject('This discount code is not valid')
            accept(response.data)
        } catch (e) {
            console.error('Error validating discount code:', e)
            reject('Failed to validate discount code. Please try again.')
        } finally {
            setValidating(false)
        }
    }

    useEffect(() => {
        if (validateInitial && initialCode) validate(initialCode)
        // only the code the checkout opened with is checked on its own
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    function changeCode(value: string) {
        setCode(value)
        setValidated(null)
        setError(null)
    }

    function clear() {
        setCode('')
        setValidated(null)
        setError(null)
    }

    function applyPendingYearly() {
        setValidated(pendingYearly)
        setPendingYearly(null)
        setError(null)
    }

    return { code, validated, pendingYearly, validating, error, validate, changeCode, clear, applyPendingYearly }
}

export type DiscountCodeState = ReturnType<typeof useDiscountCode>

/** the share of the price a percent discount takes off, 0 for anything else */
export function discountPercentOf(discount: ValidatedDiscount | null) {
    return discount?.amountType === 'percent' && discount.amount ? discount.amount : 0
}
