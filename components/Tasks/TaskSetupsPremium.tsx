'use client'
import { useRef, type Ref } from 'react'
import { Alert, Badge, Spinner, Table } from 'react-bootstrap'
import LockIcon from '@mui/icons-material/Lock'
import type { PublicGearTaggedItem, PublicTaskGearSetup, PublicTaskGearSetups } from '../../api/publicTaskApi'
import type { TaskSetupDetails, TaskSetupDetailsStatus } from '../../hooks/useTaskSetupDetails'
import { convertTagToName } from '../../utils/Formatter'
import { PremiumGate } from '../Premium/PremiumGate'
import {
    capitalize,
    describeComparison,
    describeLockedTiers,
    formatPrice,
    getTableRows,
    toAcquisitionItem,
    toBasisInfo,
    formatHours,
    formatMaybeCoins,
    formatPercent,
    formatSignedCoins,
    formatSignedPercent,
    getSetupRows,
    getStabilityBg,
    hasPayback
} from './taskSetupUtils'
import { formatCount } from './taskUtils'
import { BasisBadge, ConfidenceBadge } from './TaskSetupBasis'
import { ItemAcquisition } from './TaskItemAcquisition'
import { ModifierEffects, StatMedians } from './TaskSetupInsights'

const BORROW_COST_EXPLANATION =
    'Borrow cost: you buy the gear now and sell it back later, so what you really pay is the difference between buy and resale, after market tax and price risk.'
const NUMBER_COLUMNS = 9
// zIndex: the position-relative locked cells would otherwise paint over the sticky column while scrolling sideways
const stickyName = { position: 'sticky', left: 0, zIndex: 1, background: 'var(--bs-body-bg)' } as const

/** Only the first cell of a locked row says "Premium only", the others are just locks. */
function LockedCell({ label, onUnlock }: { label?: string; onUnlock?: () => void }) {
    return (
        // position-relative: the visually-hidden text is absolute and would otherwise escape the table's scroll box and widen the page
        <td className="text-muted position-relative" data-locked="true">
            <button type="button" className="btn btn-link text-muted p-0 border-0" aria-label="Show premium access options" onClick={onUnlock} disabled={!onUnlock}>
                <LockIcon fontSize="inherit" aria-hidden="true" />
            </button>
            {label ? <span className="visually-hidden">{label}</span> : null}
        </td>
    )
}

function StabilityBadge({ stability }: { stability?: string | null }) {
    if (!stability) {
        return <>–</>
    }
    return <Badge bg={getStabilityBg(stability)}>{capitalize(stability)}</Badge>
}

function SetupNote({ setup }: { setup: PublicTaskGearSetup }) {
    if (setup.status === 'baseline' && !setup.locked) {
        return <div className="small text-muted">{formatMaybeCoins(setup.coinsPerHour)} coins/h</div>
    }
    if (setup.noProfitGain) {
        return <div className="small text-muted">No extra profit on this task</div>
    }
    if (setup.paybackTooLong) {
        return <div className="small text-muted">Full buy cost takes more than 150 hours to recover</div>
    }
    return null
}

function SetupNameCell({ setup }: { setup: PublicTaskGearSetup }) {
    return (
        <th scope="row" style={stickyName}>
            {setup.name}
            <SetupNote setup={setup} />
        </th>
    )
}

function LockedRow({ setup, onUnlock }: { setup: PublicTaskGearSetup; onUnlock?: () => void }) {
    return (
        <tr>
            <SetupNameCell setup={setup} />
            {Array.from({ length: NUMBER_COLUMNS }, (_, i) => (
                <LockedCell key={i} label={i === 0 ? 'Premium only' : undefined} onUnlock={onUnlock} />
            ))}
        </tr>
    )
}

/** Cost cells show "price unavailable" instead of numbers when a price is missing. */
function CostCells({ setup }: { setup: PublicTaskGearSetup }) {
    if (setup.priceIncomplete) {
        return (
            <td colSpan={3} className="text-muted">
                Price unavailable
            </td>
        )
    }
    return (
        <>
            <td>{formatPrice(setup.buyCost, setup.priceLowerBound)}</td>
            <td>{formatMaybeCoins(setup.resaleValue)}</td>
            <td>{formatMaybeCoins(setup.borrowCost)}</td>
        </>
    )
}

function PaybackCells({ setup }: { setup: PublicTaskGearSetup }) {
    const show = hasPayback(setup) && !setup.priceIncomplete
    return (
        <>
            <td>{show ? formatHours(setup.paybackHoursBorrow) : '–'}</td>
            <td>{show ? formatHours(setup.paybackHoursFull) : '–'}</td>
            <td>{show ? formatSignedCoins(setup.netGain10h) : '–'}</td>
            <td>{show ? formatSignedCoins(setup.netGain50h) : '–'}</td>
        </>
    )
}

function NumbersRow({ setup }: { setup: PublicTaskGearSetup }) {
    return (
        <tr>
            <SetupNameCell setup={setup} />
            <td>{setup.status === 'baseline' ? '–' : formatSignedCoins(setup.deltaCoinsPerHour)}</td>
            <CostCells setup={setup} />
            <PaybackCells setup={setup} />
            <td>
                <StabilityBadge stability={setup.stability} />
            </td>
        </tr>
    )
}

function ItemBreakdownRow({ item }: { item: PublicGearTaggedItem }) {
    const name = <th scope="row">{item.itemName || convertTagToName(item.itemTag)}</th>
    if (!item.tradeable) {
        return (
            <tr>
                {name}
                <td colSpan={6} className="text-muted">
                    Not sellable on the market
                </td>
            </tr>
        )
    }
    return (
        <tr>
            {name}
            <td>{formatPrice(item.buyPrice, item.priceLowerBound)}</td>
            <td>{formatMaybeCoins(item.resaleValue)}</td>
            <td>
                <StabilityBadge stability={item.stability} />
            </td>
            <td>{formatPercent(item.cv)}</td>
            <td>{formatSignedPercent(item.trendPerWeek)}</td>
            <td>{item.volumePerDay === null || item.volumePerDay === undefined ? '–' : formatCount(item.volumePerDay)}</td>
        </tr>
    )
}

function ItemBreakdown({ setup }: { setup: PublicTaskGearSetup }) {
    return (
        <details className="mb-2">
            <summary>{setup.name}: price per item</summary>
            <Table size="sm" responsive className="mt-2">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Buy</th>
                        <th>Resale</th>
                        <th>Stability</th>
                        <th>Volatility (CV)</th>
                        <th>Trend / week</th>
                        <th>Sales / day</th>
                    </tr>
                </thead>
                <tbody>
                    {setup.items.map((item, i) => (
                        <ItemBreakdownRow key={`${item.itemTag}-${i}`} item={item} />
                    ))}
                </tbody>
            </Table>
        </details>
    )
}

function NumbersTable({ rows, onUnlock }: { rows: PublicTaskGearSetup[]; onUnlock?: () => void }) {
    return (
        <Table bordered responsive className="align-middle mb-1" data-cy="task-setups-table">
            <thead>
                <tr>
                    <th style={stickyName}>Setup</th>
                    <th>Δ coins/h</th>
                    <th>Buy cost</th>
                    <th>Resale value</th>
                    <th>Borrow cost</th>
                    <th>Payback (borrow)</th>
                    <th>Payback (full price)</th>
                    <th>Net gain 10h</th>
                    <th>Net gain 50h</th>
                    <th>Price stability</th>
                </tr>
            </thead>
            <tbody>
                {rows.map(setup => (setup.locked ? <LockedRow key={setup.id} setup={setup} onUnlock={onUnlock} /> : <NumbersRow key={setup.id} setup={setup} />))}
            </tbody>
        </Table>
    )
}

function LockedGate({ status, rows, disclosureRef }: { status: TaskSetupDetailsStatus; rows: PublicTaskGearSetup[]; disclosureRef: Ref<HTMLDetailsElement> }) {
    const locked = rows.filter(setup => setup.locked)
    const requiredTier = locked.every(setup => setup.requiredTier === 'premium_plus') ? 'premium_plus' : 'premium'
    return (
        <PremiumGate
            disclosureRef={disclosureRef}
            isSignedIn={status === 'premiumRequired'}
            requiredTier={requiredTier}
            message={
                <>
                    {describeLockedTiers(locked.filter(setup => requiredTier === 'premium_plus' || setup.requiredTier !== 'premium_plus'))} {requiredTier === 'premium_plus' ? 'gear' : 'numbers'} require <strong>{requiredTier === 'premium_plus' ? 'Premium+' : 'Premium'}</strong>.
                    {requiredTier === 'premium' && locked.some(setup => setup.requiredTier === 'premium_plus') ? ' Endgame gear requires Premium+.' : null}
                </>
            }
        />
    )
}

/** Gear and acquisition details revealed by the authorized response. */
function UnlockedTierDetails({ setup }: { setup: PublicTaskGearSetup }) {
    return (
        <div className="mb-3" data-cy="premium-tier-details">
            <div className="d-flex flex-wrap align-items-center gap-1 mb-1">
                <strong className="me-1">{setup.name}</strong>
                <BasisBadge basis={toBasisInfo(setup)} />
                <ConfidenceBadge confidence={setup.confidence} />
            </div>
            <ul className="list-unstyled mb-0">
                {setup.items.map((item, i) => (
                    <li key={`${item.itemTag}-${i}`} className="mb-2 text-break">
                        {item.itemName || convertTagToName(item.itemTag)}
                        <ItemAcquisition item={toAcquisitionItem(item)} name={item.itemName || convertTagToName(item.itemTag)} />
                    </li>
                ))}
            </ul>
        </div>
    )
}

function PremiumInsights({ rows, publicRows, effects }: { rows: PublicTaskGearSetup[]; publicRows: PublicTaskGearSetup[]; effects: PublicTaskGearSetups['modifierEffects'] }) {
    const wasLocked = new Set(publicRows.filter(s => s.locked).map(s => s.tier))
    const opened = rows.filter(s => wasLocked.has(s.tier) && !s.locked)
    return (
        <div data-cy="premium-insights">
            {opened.map(setup => (
                <UnlockedTierDetails key={setup.id} setup={setup} />
            ))}
            {rows.map(setup => (
                <StatMedians key={setup.id} setup={setup} />
            ))}
            <ModifierEffects effects={effects} />
        </div>
    )
}

function isLockedStatus(status: TaskSetupDetailsStatus): boolean {
    return status === 'signedOut' || status === 'invalidToken' || status === 'premiumRequired'
}

/** Authorized details replace public rows while any remaining locked tiers keep their gate. */
export function TaskSetupsPremium({ setups, details }: { setups: PublicTaskGearSetups; details: TaskSetupDetails }) {
    const gateRef = useRef<HTMLDetailsElement>(null)
    const publicRows = getSetupRows(setups)
    const premium = details.data
    const rows = premium ? getSetupRows(premium) : publicRows
    const tableRows = getTableRows(premium ?? setups)
    const comparison = describeComparison(premium ?? setups)
    function openGate() {
        if (gateRef.current) {
            gateRef.current.open = true
            gateRef.current.querySelector('summary')?.focus()
            gateRef.current.scrollIntoView({ block: 'nearest' })
        }
    }
    return (
        <div className="mt-4" data-cy="task-setups-premium">
            <h3 className="h5">Cost and payback</h3>
            <p className="small text-muted">{BORROW_COST_EXPLANATION}</p>
            {details.status === 'loading' ? (
                <Spinner size="sm" role="status">
                    <span className="visually-hidden">Loading…</span>
                </Spinner>
            ) : null}
            {details.status === 'error' ? <Alert variant="danger">The premium numbers could not be loaded, try again later.</Alert> : null}
            <NumbersTable rows={tableRows} onUnlock={isLockedStatus(details.status) ? openGate : undefined} />
            {rows.some(s => s.priceLowerBound) ? <p className="small text-muted mb-1" data-cy="lower-bound-note">≥ means the price is only a lower bound, e.g. the gear still needs grinding.</p> : null}
            {comparison ? <p className="small text-muted mb-1" data-cy="comparison-note">{comparison}</p> : null}
            <p className="small text-muted d-sm-none">Scroll the table sideways for all columns.</p>
            {rows.filter(s => !s.locked).map(setup => (
                <ItemBreakdown key={setup.id} setup={setup} />
            ))}
            {premium ? <PremiumInsights rows={rows} publicRows={publicRows} effects={premium.modifierEffects} /> : null}
            {isLockedStatus(details.status) ? <LockedGate status={details.status} rows={rows} disclosureRef={gateRef} /> : null}
        </div>
    )
}
