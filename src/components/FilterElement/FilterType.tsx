export enum FilterType {
    EQUAL = 1,
    HIGHER = 2,
    LOWER = 4,
    DATE = 8,
    NUMERICAL = 16,
    RANGE = 32,
    PLAYER = 64,
    SIMPLE = 128
}


/**
 * Checks if a flag is present
 * @param full the enum that should contain the flag
 * @param flag the flag to test against
 * @returns true if the enum contains the flag
 */
export function hasFlag(full, flag) {
    return full && flag && (full & flag) === flag;
}