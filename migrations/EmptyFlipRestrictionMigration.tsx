import { getSettingsObject, RESTRICTIONS_SETTINGS_KEY, setSetting } from "../utils/SettingsUtils";

export function startEmptyFlipRestrictionMigration() {
    let restrictions = getSettingsObject<FlipRestriction[]>(RESTRICTIONS_SETTINGS_KEY, []);
    let validRestrictions: FlipRestriction[] = [];
    for (let i = 0; i < restrictions.length; i++) {
        const restriction = restrictions[i];
        if (!restriction.item || (restriction.item && restriction.item.tag)) {
            validRestrictions.push(restriction);
        }
    }
    setSetting(RESTRICTIONS_SETTINGS_KEY, JSON.stringify(validRestrictions));
}