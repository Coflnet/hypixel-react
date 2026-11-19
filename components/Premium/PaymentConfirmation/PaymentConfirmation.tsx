'use client'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { Button, Spinner } from 'react-bootstrap'
import Confetti from '../../Confetti/Confetti'
import GoogleSignIn from '../../GoogleSignIn/GoogleSignIn'
import NavBar from '../../NavBar/NavBar'
import { usePaymentConfirmation } from './usePaymentConfirmation'

// The success page after a payment provider sent the buyer back: it waits for Payments to confirm the purchase instead of
// claiming success while the provider is still confirming the payment.

const DISCORD_URL = 'https://discord.gg/wvKXfTgCfb'
const SUPPORT_EMAIL = 'support@coflnet.com'

function Title({ children, color }: { children: ReactNode; color?: string }) {
    return (
        <h2>
            <NavBar />
            <span style={{ color }}>{children}</span>
        </h2>
    )
}

function SupportHint({ reference }: { reference: string | null }) {
    return (
        <p data-testid="payment-slow">
            Some payment methods take longer to confirm, for example bank transfers or crypto payments. You can keep this page open or come back
            later: your purchase is added to your account automatically once the payment is confirmed. If your Premium isn&apos;t active within a
            few minutes (or your CoflCoins haven&apos;t arrived after your bank transfer or crypto payment went through), please reach out to us on{' '}
            <a href={DISCORD_URL} target="_blank" rel="noreferrer">
                Discord
            </a>{' '}
            or at <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> and quote{' '}
            {reference ? (
                <>
                    the reference <code data-testid="payment-reference">{reference}</code>
                </>
            ) : (
                'the email address of your account and the time of your purchase'
            )}
            .
        </p>
    )
}

function Waiting({ slow, reference }: { slow: boolean; reference: string | null }) {
    return (
        <>
            <Title>
                <Spinner animation="border" size="sm" aria-hidden="true" /> Waiting for payment confirmation…
            </Title>
            <p>Thank you for your purchase! Your payment provider is confirming the payment. This page updates on its own as soon as it is confirmed.</p>
            {slow ? <SupportHint reference={reference} /> : null}
        </>
    )
}

function Confirmed() {
    return (
        <>
            <Title color="lime">Payment confirmed</Title>
            <p>Thank you for your purchase! Your payment is confirmed and your purchase has been added to your account.</p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <Link href="/premium" className="disableLinkStyle">
                    <Button>Go to the Premium page</Button>
                </Link>
                <Link href="/account" className="disableLinkStyle">
                    <Button variant="secondary">Go to your account</Button>
                </Link>
            </div>
            <Confetti recycle={false} />
        </>
    )
}

function LoggedOut({ onLogin }: { onLogin(): void }) {
    return (
        <>
            <Title>Thank you for your purchase!</Title>
            <p>Please log in with the account you made the purchase with to see the status of your payment.</p>
            <p>
                The purchase is added to that account as soon as your payment provider confirms the payment. For some payment methods, such as bank
                transfers or crypto payments, this can take longer.
            </p>
            <GoogleSignIn onAfterLogin={onLogin} />
        </>
    )
}

export default function PaymentConfirmation() {
    const { status, slow, reference, recheck } = usePaymentConfirmation()
    if (status === 'loggedOut') return <LoggedOut onLogin={recheck} />
    if (status === 'confirmed') return <Confirmed />
    return <Waiting slow={slow} reference={reference} />
}
