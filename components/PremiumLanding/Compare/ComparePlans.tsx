import { COMPARE_GROUPS, CompareCell, CompareRow, FREE_ON_EVERY_ACCOUNT } from '../content/comparison'
import { getChatColor } from '../content/chatColors'
import { getFeature } from '../content/features'
import { TIER_CLASS, TIER_NAMES } from '../content/tiers'
import page from '../PremiumLanding.module.css'
import ComparePreview from './ComparePreview'
import styles from './ComparePlans.module.css'

function Cell({ value, chatColor }: { value: CompareCell; chatColor?: boolean }) {
    if (value === true) {
        return (
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" className={styles.yes} role="img" aria-label="Included">
                <path d="M3 8.5l3.5 3.5L13 5" />
            </svg>
        )
    }
    if (value === false) {
        return (
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className={styles.no} role="img" aria-label="Not included">
                <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
        )
    }
    const color = chatColor ? getChatColor(value) : undefined
    return <span style={color ? { color, fontWeight: 600 } : undefined}>{value}</span>
}

function RowLabel({ row, rowId }: { row: CompareRow; rowId: string }) {
    const feature = getFeature(row.clipId)
    return (
        <th scope="row" className={styles.label}>
            <span className={styles.labelInner}>
                <span className={styles.labelText}>{row.label}</span>
                {feature?.media ? (
                    <ComparePreview rowId={rowId} featureId={feature.id} title={feature.title} short={feature.short} media={feature.media} />
                ) : null}
            </span>
        </th>
    )
}

/** the "Compare Plans" section: server-rendered table, only the Preview buttons are client components */
export default function ComparePlans() {
    return (
        <section id="compare" className={page.section}>
            <div className={page.sectionInner}>
                <h2 className={page.sectionTitle}>Compare Plans</h2>
                <div className={`${page.card} ${styles.freeStrip}`}>
                    <span className={styles.freeTitle}>Free on every account</span>
                    <span className={page.muted}>{FREE_ON_EVERY_ACCOUNT}</span>
                </div>
                <div className={styles.scroller} role="region" aria-label="Plan comparison" tabIndex={0}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th scope="col" className={styles.featureHead}>
                                    Feature
                                </th>
                                {TIER_NAMES.map(tier => (
                                    <th key={tier} scope="col" className={`${styles.tierHead} ${page[TIER_CLASS[tier]]}`}>
                                        {tier}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        {COMPARE_GROUPS.map((group, groupIndex) => (
                            <tbody key={group.label}>
                                <tr>
                                    <th scope="colgroup" colSpan={5} className={styles.group}>
                                        {group.label}
                                    </th>
                                </tr>
                                {group.rows.map((row, rowIndex) => (
                                    <tr key={row.label}>
                                        <RowLabel row={row} rowId={`${groupIndex}-${rowIndex}`} />
                                        {row.cells.map((cell, index) => (
                                            <td key={TIER_NAMES[index]} className={styles.cell}>
                                                <Cell value={cell} chatColor={row.chatColors} />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        ))}
                    </table>
                </div>
            </div>
        </section>
    )
}
