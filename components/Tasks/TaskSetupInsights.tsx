import type { PublicModifierEffect } from '../../api/_generated/skyApi.schemas'
import type { PublicTaskGearSetup } from '../../api/publicTaskApi'
import { formatModifierEffect, prettifyKey } from './taskSetupUtils'
import { formatCount } from './taskUtils'

/** Premium, measured setups only: the median stats of the players with this gear. */
export function StatMedians({ setup }: { setup: PublicTaskGearSetup }) {
    const entries = Object.entries(setup.statMedians ?? {})
    if (entries.length === 0) {
        return null
    }
    return (
        <div className="small mb-2" data-cy="stat-medians">
            <strong>{setup.name}</strong> median stats:{' '}
            {entries.map(([name, value], i) => (
                <span key={name} className="me-2 d-inline-block">
                    {prettifyKey(name)} {formatCount(value)}
                    {i < entries.length - 1 ? ',' : ''}
                </span>
            ))}
        </div>
    )
}

/** Premium: what changing one part of the gear did for the players that did it. */
export function ModifierEffects({ effects }: { effects?: PublicModifierEffect[] | null }) {
    if (!effects || effects.length === 0) {
        return null
    }
    return (
        <div className="mt-3" data-cy="modifier-effects">
            <h3 className="h5">What upgrades changed for players</h3>
            <ul className="small">
                {effects.map((effect, i) => (
                    <li key={i}>{formatModifierEffect(effect)}</li>
                ))}
            </ul>
        </div>
    )
}
