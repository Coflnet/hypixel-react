'use client'
import { ReactNode, useId } from 'react'
import type { AutoDiscount, ValidatedDiscount } from '../../../api/_generated/skyApi.schemas'
import {
    PaymentProvider,
    describeFixedAmount,
    describePromotion,
    getFirstPeriodLabel,
    getPeriodPercent,
    isFirstPaymentOnly,
    isPercentDiscount
} from '../../../utils/SubscriptionCheckout'
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
    /** the billing period in weeks; codes with per-period amounts name the one for it */
    weeks?: number
    /** shown under the error, e.g. to switch to a billing period the code works with */
    errorAction?: ReactNode
}

function describeDiscountAmount(discount: ValidatedDiscount, weeks?: number): string {
    if (!isPercentDiscount(discount)) return describeFixedAmount(discount.amount)
    return `${weeks === undefined ? discount.amount : getPeriodPercent(discount, weeks)}% off`
}

function describeDiscountScope(discount: ValidatedDiscount, weeks?: number): string {
    // "50% off the first year"
    if (isFirstPaymentOnly(discount)) return weeks === undefined ? ' the first payment' : ` the ${getFirstPeriodLabel(weeks)}`
    if (discount.durationInMonths > 0) return ` for ${discount.durationInMonths} payment${discount.durationInMonths > 1 ? 's' : ''}`
    return ''
}

export function DiscountCodeMessage({ error, discount, weeks, errorAction }: DiscountCodeMessageProps) {
    if (error)
        return (
            <CheckoutError>
                {error}
                {errorAction}
            </CheckoutError>
        )
    if (!discount?.isValid) return null
    return (
        <CheckoutSuccess>
            <strong>✓ Discount code valid!</strong> {discount.name ? `${discount.name}: ` : ''}
            {describeDiscountAmount(discount, weeks)}
            {describeDiscountScope(discount, weeks)}
        </CheckoutSuccess>
    )
}

/** the running promotion's terms (amount, first payment only, end date); `weeks` names the amount of that billing period */
export function PromotionNote({ promotion, weeks }: { promotion: AutoDiscount; weeks?: number }) {
    return (
        <p className={styles.promotion} data-testid="promotion-note">
            {describePromotion(promotion, weeks)} Applied automatically at checkout.
        </p>
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
    /** id of a hint under the button */
    describedBy?: string
    onClick(): void
    children: ReactNode
}

export function CheckoutButton({ tier, busy, busyLabel, disabled, describedBy, onClick, children }: CheckoutButtonProps) {
    return (
        <button
            type="button"
            className={`${styles.cta} ${CTA_TIER_CLASS[tier]}`}
            onClick={onClick}
            disabled={disabled || busy}
            aria-busy={busy || undefined}
            aria-describedby={describedBy}
        >
            {busy && busyLabel ? busyLabel : children}
        </button>
    )
}

function CardIcon() {
    return (
        <svg className={styles.cardIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M3 10h18M7 15h4" />
        </svg>
    )
}

interface ProviderButtonProps {
    tier: PremiumTier
    busy: boolean
    disabled: boolean
    onClick(): void
}

function CardButton({ tier, busy, disabled, onClick }: ProviderButtonProps) {
    const hintId = useId()
    return (
        <div className={styles.providerOption}>
            <CheckoutButton tier={tier} busy={busy} busyLabel="Redirecting to Stripe..." disabled={disabled} describedBy={hintId} onClick={onClick}>
                <CardIcon />
                Pay with card
            </CheckoutButton>
            <span id={hintId} className={styles.providerHint}>
                Secure checkout by Stripe. Also Apple Pay and Google Pay where available.
            </span>
        </div>
    )
}

/** PayPal's colours on a dark page: the white button with the blue wordmark */
function PayPalButton({ busy, disabled, onClick }: ProviderButtonProps) {
    const hintId = useId()
    return (
        <div className={styles.providerOption}>
            <button
                type="button"
                className={styles.paypal}
                onClick={onClick}
                disabled={disabled || busy}
                aria-busy={busy || undefined}
                aria-label={busy ? undefined : 'Pay with PayPal'}
                aria-describedby={hintId}
            >
                {busy ? 'Redirecting to PayPal...' : <span className={styles.paypalWordmark}>PayPal</span>}
            </button>
            <span id={hintId} className={styles.providerHint}>
                Subscribe with your PayPal account.
            </span>
        </div>
    )
}

interface ProviderButtonsProps {
    tier: PremiumTier
    /** the direct providers to offer, card first */
    providers: PaymentProvider[]
    /** the provider whose checkout is opening; every button is disabled meanwhile */
    busyProvider: PaymentProvider | null
    disabled?: boolean
    onPay(provider: PaymentProvider): void
}

/** one button per payment provider: card (Stripe) in the tier colour, then PayPal */
export function ProviderButtons({ tier, providers, busyProvider, disabled, onPay }: ProviderButtonsProps) {
    return (
        <>
            {providers.map(provider => {
                const Button = provider === 'paypal' ? PayPalButton : CardButton
                return (
                    <Button
                        key={provider}
                        tier={tier}
                        busy={busyProvider === provider}
                        disabled={!!disabled || busyProvider !== null}
                        onClick={() => onPay(provider)}
                    />
                )
            })}
        </>
    )
}

/** The pay action and what happens after it: one checkout button, or a button per payment provider (ProviderButtons). */
export function PaymentActions({ note, children }: { note?: ReactNode; children: ReactNode }) {
    return (
        <div className={styles.payment} data-testid="checkout-payment">
            {children}
            {note ? <p className={styles.note}>{note}</p> : null}
        </div>
    )
}
