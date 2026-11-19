'use client'
import { Button } from 'react-bootstrap'
import type { PublicAcquisitionUpgrade, PublicCheapestBase, PublicGrindRequirement } from '../../api/_generated/skyApi.schemas'
import type { PublicAcquisition } from '../../api/_generated/skyApi.schemas'
import { copyAndRunInGame } from '../../utils/InGameCommandUtils'
import { getViewAuctionCommand } from '../../utils/viewAuctionCommand'
import { describeSpec, type AcquisitionItem, formatMaybeCoins, formatPrice, prettifyKey } from './taskSetupUtils'

function copyAuctionCommand(command: string) {
    copyAndRunInGame(command, {
        copiedMessage: (
            <p>
                Copied ingame link <br />
                <i>{command}</i>
            </p>
        ),
        toastOptions: { autoClose: 1500, pauseOnFocusLoss: false }
    })
}

function ViewAuctionButton({ command, label, itemName }: { command?: string; label: string; itemName: string }) {
    const safe = getViewAuctionCommand(command)
    if (!safe) {
        return null
    }
    return (
        <Button size="sm" variant="outline-primary" className="py-0 ms-2" data-cy="view-auction" aria-label={`${label} of ${itemName}`} onClick={() => copyAuctionCommand(safe)}>
            {label}
        </Button>
    )
}

function describeUpgrade(upgrade: PublicAcquisitionUpgrade): string {
    const levels = upgrade.fromLevel || upgrade.toLevel ? ` ${upgrade.fromLevel ?? 0} → ${upgrade.toLevel ?? 0}` : ''
    const amount = upgrade.amount > 1 ? ` ×${upgrade.amount}` : ''
    return `${prettifyKey(upgrade.name || upgrade.kind)}${levels}${amount}`
}

function UpgradeList({ upgrades }: { upgrades: PublicAcquisitionUpgrade[] }) {
    if (upgrades.length === 0) {
        return null
    }
    return (
        <details className="small" data-cy="upgrade-list">
            <summary>{upgrades.length} upgrades</summary>
            <ul className="mb-1 ps-3">
                {upgrades.map((upgrade, i) => (
                    <li key={i}>
                        {describeUpgrade(upgrade)}: {upgrade.priced ? formatMaybeCoins(upgrade.cost) : <span className="text-muted">price unavailable</span>}
                    </li>
                ))}
            </ul>
        </details>
    )
}

function GrindLines({ grind }: { grind: PublicGrindRequirement[] }) {
    return (
        <>
            {grind.map((g, i) => (
                <div key={i} className="small text-warning-emphasis" data-cy="grind-required">
                    needs grinding: {prettifyKey(g.name || g.kind)} (have {g.have} / need {g.need})
                </div>
            ))}
        </>
    )
}

function CheapestBase({ base, lowerBound, itemName }: { base: PublicCheapestBase; lowerBound?: boolean | null; itemName: string }) {
    const upgrades = base.upgrades ?? []
    return (
        <div data-cy="cheapest-base">
            <div className="small">
                Cheapest base: {formatMaybeCoins(base.basePrice)} + upgrades = <strong>{formatPrice(base.total, lowerBound)}</strong>
                <ViewAuctionButton command={base.command ?? undefined} label="View base" itemName={itemName} />
            </div>
            <UpgradeList upgrades={upgrades} />
            <GrindLines grind={base.grindRequired ?? []} />
            {base.incomplete ? <div className="small text-muted">price incomplete</div> : null}
        </div>
    )
}

function unavailableText(reason?: string | null): string {
    return reason ? prettifyKey(reason).toLowerCase() : 'not available'
}

/** An acquisition without any option or reason says nothing. */
function hasAcquisitionContent(acquisition?: PublicAcquisition | null): acquisition is PublicAcquisition {
    return !!acquisition && !!(acquisition.direct || acquisition.cheapestBase || acquisition.directUnavailableReason || acquisition.baseUnavailableReason)
}

/** Compact spec, buy-now and cheapest-base rows of an item; renders nothing for items without a spec and acquisition. */
export function ItemAcquisition({ item, name }: { item: AcquisitionItem; name: string }) {
    const spec = describeSpec(item.spec)
    const acquisition = hasAcquisitionContent(item.acquisition) ? item.acquisition : undefined
    if (spec.length === 0 && !acquisition && item.modifiersMeasured !== false) {
        return null
    }
    return (
        <div className="ms-4 mt-1" data-cy="item-acquisition">
            {spec.length > 0 ? <div className="small text-muted text-break">{spec.join(' · ')}</div> : null}
            {item.modifiersMeasured === false ? <div className="small text-muted">modifiers not measured</div> : null}
            {acquisition ? <AcquisitionRows acquisition={acquisition} lowerBound={item.priceLowerBound} itemName={name} /> : null}
        </div>
    )
}

function AcquisitionRows({ acquisition, lowerBound, itemName }: { acquisition: PublicAcquisition; lowerBound?: boolean | null; itemName: string }) {
    const { direct, cheapestBase } = acquisition
    return (
        <>
            {direct ? (
                <div className="small" data-cy="buy-now">
                    Buy now: <strong>{formatMaybeCoins(direct.price)}</strong>
                    <ViewAuctionButton command={direct.command ?? undefined} label="View auction" itemName={itemName} />
                </div>
            ) : (
                <div className="small text-muted">Buy now: {unavailableText(acquisition.directUnavailableReason)}</div>
            )}
            {cheapestBase ? (
                <CheapestBase base={cheapestBase} lowerBound={lowerBound} itemName={itemName} />
            ) : (
                <div className="small text-muted">Cheapest base: {unavailableText(acquisition.baseUnavailableReason)}</div>
            )}
            {lowerBound ? (
                <div className="small text-muted" data-cy="lower-bound">
                    at least this much, the price is only a lower bound
                </div>
            ) : null}
        </>
    )
}
