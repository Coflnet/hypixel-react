'use client'
import { ReactNode, useId } from 'react'
import type { ValidatedDiscount } from '../../../api/_generated/skyApi.schemas'
import { PremiumTier } from '../PremiumPurchaseWizard/types'
import styles from './Checkout.module.css'

// Building blocks of the wizard's last step, shared by the subscription and the CoflCoins checkout.

export function CheckoutLayout({ summary, actions, children }: { summary: ReactNode; actions: ReactNode; children?: ReactNode }) {
    return (
        <div className={styles.checkout}>
            <div className={styles.layout}>
                <div className={styles.summary}>{summary}</div>
                <div className={styles.actions}>{actions}</div>
            </div>
            {children}
        </div>
    )
}

export function SummaryRow({ label, children }: { label: ReactNode; children: ReactNode }) {
    return (
        <div className={styles.row}>
            <span className={styles.rowLabel}>{label}</span>
            <span className={styles.rowValue}>{children}</span>
        </div>
    )
}

interface SummaryTotalProps {
    label: string
    amount: ReactNode
    unit?: ReactNode
    /** the price before discounts, struck through */
    original?: ReactNode
    children?: ReactNode
}

export function SummaryTotal({ label, amount, unit, original, children }: SummaryTotalProps) {
    return (
        <div className={styles.total}>
            <span className={styles.rowLabel}>{label}</span>
            <div className={styles.totalLine}>
                <span className={styles.totalAmount}>{amount}</span>
                {original ? <s className={styles.original}>{original}</s> : null}
                {unit ? <span className={styles.totalUnit}>{unit}</span> : null}
            </div>
            {children}
        </div>
    )
}

export function Savings({ children }: { children: ReactNode }) {
    return <p className={styles.savings}>{children}</p>
}

export function SummaryNote({ children }: { children: ReactNode }) {
    return <p className={styles.note}>{children}</p>
}

export function CheckoutError({ children }: { children: ReactNode }) {
    return (
        <div className={styles.error} role="alert">
            {children}
        </div>
    )
}

export function CheckoutSuccess({ children }: { children: ReactNode }) {
    return (
        <div className={styles.success} role="status">
            {children}
        </div>
    )
}

interface CodeDisclosureProps {
    open: boolean
    onToggle(): void
    children: ReactNode
}

/** the discount and creator code fields stay behind a link until the visitor asks for them or a code is in use */
export function CodeDisclosure({ open, onToggle, children }: CodeDisclosureProps) {
    const panelId = useId()
    return (
        <div className={styles.codes}>
            <button type="button" className={styles.disclosure} aria-expanded={open} aria-controls={panelId} onClick={onToggle}>
                Have a discount or creator code?
                <svg className={styles.disclosureIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M6 9l6 6 6-6" />
                </svg>
            </button>
            <div id={panelId} className={styles.codeFields} hidden={!open}>
                {children}
            </div>
        </div>
    )
}

interface CodeFieldProps {
    label: string
    placeholder: string
    value: string
    onChange(value: string): void
    disabled?: boolean
    actionLabel: ReactNode
    onAction(): void
    actionDisabled?: boolean
    /** messages under the field (error, success) */
    children?: ReactNode
}

export function CodeField({ label, placeholder, value, onChange, disabled, actionLabel, onAction, actionDisabled, children }: CodeFieldProps) {
    const inputId = useId()
    return (
        <div className={styles.codeField}>
            <label htmlFor={inputId} className={styles.codeLabel}>
                {label}
            </label>
            <div className={styles.codeInputRow}>
                <input
                    id={inputId}
                    type="text"
                    autoComplete="off"
                    className={styles.codeInput}
                    placeholder={placeholder}
                    value={value}
                    onChange={event => onChange(event.target.value)}
                    disabled={disabled}
                />
                <button type="button" className={styles.secondaryButton} onClick={onAction} disabled={actionDisabled}>
                    {actionLabel}
                </button>
            </div>
            {children}
        </div>
    )
}

export function CreatorCodeMessage({ percent }: { percent: number | null }) {
    return <CheckoutSuccess>{percent ? `✓ Creator code applied! You get ${percent}% off` : '✓ Creator code applied'}</CheckoutSuccess>
}

interface DiscountCodeMessageProps {
    error: string | null
    discount: ValidatedDiscount | null
    /** shown under the error, e.g. to switch to a billing period the code works with */
    errorAction?: ReactNode
}

export function DiscountCodeMessage({ error, discount, errorAction }: DiscountCodeMessageProps) {
    if (error)
        return (
            <CheckoutError>
                {error}
                {errorAction}
            </CheckoutError>
        )
    if (!discount?.isValid) return null
    const amount = discount.amountType === 'percent' || discount.amountType === 'percentage' ? `${discount.amount}% off` : `${discount.amount} off`
    return (
        <CheckoutSuccess>
            <strong>✓ Discount code valid!</strong> {discount.name ? `${discount.name}: ` : ''}
            {amount}
            {discount.durationInMonths > 0 ? ` for ${discount.durationInMonths} payment${discount.durationInMonths > 1 ? 's' : ''}` : ''}
        </CheckoutSuccess>
    )
}

const CTA_TIER_CLASS: Record<PremiumTier, string> = {
    [PremiumTier.STARTER]: styles.ctaPremium,
    [PremiumTier.PREMIUM]: styles.ctaPremium,
    [PremiumTier.PREMIUM_PLUS]: styles.ctaPremiumPlus
}

interface CheckoutButtonProps {
    tier: PremiumTier
    busy?: boolean
    busyLabel?: string
    disabled?: boolean
    onClick(): void
    children: ReactNode
}

export function CheckoutButton({ tier, busy, busyLabel, disabled, onClick, children }: CheckoutButtonProps) {
    return (
        <button type="button" className={`${styles.cta} ${CTA_TIER_CLASS[tier]}`} onClick={onClick} disabled={disabled || busy} aria-busy={busy || undefined}>
            {busy && busyLabel ? busyLabel : children}
        </button>
    )
}

/**
 * The pay action and what happens after it. A choice of payment providers (card via Stripe, PayPal) will be listed here,
 * each with its own button and note, once the backend supports them.
 */
export function PaymentActions({ note, children }: { note?: ReactNode; children: ReactNode }) {
    return (
        <div className={styles.payment} data-testid="checkout-payment">
            {children}
            {note ? <p className={styles.note}>{note}</p> : null}
        </div>
    )
}
