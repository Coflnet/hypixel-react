'use client'
import { QueryChip } from '../../utils/ActiveAuctionUtils'
import styles from './ActiveAuctionExplorer.module.css'

interface Props {
    chips: QueryChip[]
    description?: string
    onRemove(chip: QueryChip): void
    onClear?(): void
}

export default function ResolvedQueryChips(props: Props) {
    if (props.chips.length === 0) {
        return null
    }
    return (
        <div className={styles.chips} aria-label="Active search terms">
            {props.chips.map(chip => (
                <span key={`${chip.kind}:${chip.key}`} className={styles.chip} data-kind={chip.kind}>
                    {chip.label}
                    <button type="button" className={styles.chipRemove} aria-label={`Remove ${chip.label}`} onClick={() => props.onRemove(chip)}>
                        &times;
                    </button>
                </span>
            ))}
            {props.onClear && props.chips.length > 1 ? (
                <button type="button" className={styles.linkButton} onClick={props.onClear}>
                    Clear all
                </button>
            ) : null}
            {props.description ? <span className={styles.chipDescription}>{props.description}</span> : null}
        </div>
    )
}
