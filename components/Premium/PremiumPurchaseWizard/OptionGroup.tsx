'use client'
import { MouseEvent, ReactNode, useId } from 'react'
import { isPointerClick } from './wizardFlow'
import styles from './OptionGroup.module.css'

export interface WizardOption<T extends string | number> {
    value: T
    title: ReactNode
    titleClassName?: string
    description?: ReactNode
    badge?: string
    /** e.g. "-50%" for a running promotion, shown beside the price */
    discountBadge?: string
    /** e.g. "€9.69"; shown large on the right */
    price?: ReactNode
    /** the price before a discount, struck through beside `price` */
    originalPrice?: ReactNode
    /** e.g. "per month", or the charged total under a 4-week average; shown under the price */
    unit?: ReactNode
    /** a full-width line under the row (features, "Cannot downgrade") */
    footer?: ReactNode
    disabled?: boolean
    testId?: string
}

interface Props<T extends string | number> {
    legend: string
    options: WizardOption<T>[]
    selected: T | null
    /** `advance` is true for a pointer click; keyboard selection only selects */
    onChoose(value: T, advance: boolean): void
}

interface RowProps<T extends string | number> {
    option: WizardOption<T>
    name: string
    checked: boolean
    onChoose(value: T, advance: boolean): void
}

/**
 * The price before a discount, struck through. It follows the price in the text, so screen readers (which do not read the
 * strike) hear "€8.65 instead of €11.53"; a flex layout shows it first.
 */
export function StruckOriginal({ original }: { original: ReactNode }) {
    if (original == null) return null
    return (
        <span className={styles.originalWrap}>
            <span className="visually-hidden"> instead of </span>
            <s className={styles.original}>{original}</s>
        </span>
    )
}

type OptionPriceProps = Pick<WizardOption<string>, 'price' | 'originalPrice' | 'discountBadge' | 'unit'>

function OptionPrice({ price, originalPrice, discountBadge, unit }: OptionPriceProps) {
    if (price == null && unit == null) return null
    // the spaces keep the badge, the prices and the unit apart in the text content (screen readers, copy)
    return (
        <span className={styles.price}>
            {price != null ? (
                <span className={styles.priceLine}>
                    {discountBadge ? <span className={styles.discountBadge}>{discountBadge}</span> : null}{' '}
                    <span className={styles.amount}>
                        <span>{price}</span>
                        <StruckOriginal original={originalPrice} />
                    </span>
                </span>
            ) : null}{' '}
            {unit != null ? <span className={styles.unit}>{unit}</span> : null}
        </span>
    )
}

function OptionRow<T extends string | number>({ option, name, checked, onChoose }: RowProps<T>) {
    function onLabelClick(event: MouseEvent<HTMLLabelElement>) {
        // the label forwards the click to its radio; that click (and arrow keys or Space) is handled by onChange
        if (event.target instanceof HTMLInputElement) return
        if (option.disabled || !isPointerClick(event)) return
        onChoose(option.value, true)
    }

    const className = [styles.option, checked && styles.selected, option.disabled && styles.disabled].filter(Boolean).join(' ')
    return (
        <label className={className} data-testid={option.testId} onClick={onLabelClick}>
            <input
                type="radio"
                className={styles.input}
                name={name}
                value={String(option.value)}
                checked={checked}
                disabled={option.disabled}
                onChange={() => onChoose(option.value, false)}
            />
            <span className={styles.dot} aria-hidden="true" />
            <span className={styles.text}>
                <span className={styles.titleRow}>
                    <span className={`${styles.title} ${option.titleClassName ?? ''}`} data-testid="wizard-option-title">
                        {option.title}
                    </span>
                    {option.badge ? <span className={styles.badge}>{option.badge}</span> : null}
                </span>
                {option.description ? <span className={styles.description}>{option.description}</span> : null}
            </span>
            <OptionPrice price={option.price} originalPrice={option.originalPrice} discountBadge={option.discountBadge} unit={option.unit} />
            {option.footer ? <span className={styles.footer}>{option.footer}</span> : null}
        </label>
    )
}

/** a radio group of option rows: a pointer click selects and advances, arrow keys and Space only select */
export default function OptionGroup<T extends string | number>({ legend, options, selected, onChoose }: Props<T>) {
    const name = useId()
    return (
        <fieldset className={styles.group}>
            <legend className={styles.visuallyHidden}>{legend}</legend>
            <div className={styles.grid}>
                {options.map(option => (
                    <OptionRow key={String(option.value)} option={option} name={name} checked={selected === option.value} onChoose={onChoose} />
                ))}
            </div>
        </fieldset>
    )
}
