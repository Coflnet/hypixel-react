import { Fragment } from 'react'
import type { NotePart, PeriodOffer } from '../content/planPricing'
import styles from './PlanNote.module.css'

/** the price before the promotion, struck through; screen readers hear "instead of" because the strike itself is not read */
export function StruckPrice({ original }: { original: string | null }) {
    if (!original) return null
    return (
        <>
            {' '}
            <span className="visually-hidden">instead of </span>
            <s className={styles.struck}>{original}</s>
        </>
    )
}

function OfferText({ offer }: { offer: PeriodOffer }) {
    return (
        <span className={offer.badge ? styles.saleOffer : undefined}>
            {offer.amount}
            <StruckPrice original={offer.original} /> {offer.period}
            {offer.badge ? <span className={styles.badge}> ({offer.badge})</span> : null}
        </span>
    )
}

/** the note under a plan price (getPlanPrice), with the sale prices of the other billing periods */
export function PlanNote({ note }: { note: NotePart[] }) {
    return (
        <>
            {note.map((part, index) => (
                <Fragment key={index}>{typeof part === 'string' ? part : <OfferText offer={part} />}</Fragment>
            ))}
        </>
    )
}
