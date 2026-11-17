// "Compare Plans" table of the /premium redesign. Copy is taken verbatim from the approved design.
// A cell is true (included), false (not included) or a short text. `clipId` points at a feature in
// features.ts; the row gets a Preview button when that feature has media.

import { PerTier } from './tiers'

export type CompareCell = boolean | string

export interface CompareRow {
    label: string
    cells: PerTier<CompareCell>
    clipId?: string
    /** the cells are Minecraft chat color names and are shown in that color */
    chatColors?: boolean
}

export interface CompareGroup {
    label: string
    rows: CompareRow[]
}

const Y = true
const N = false

export const COMPARE_GROUPS: CompareGroup[] = [
    {
        label: 'SPEED AND RESULTS',
        rows: [
            { label: 'Average flip receive time', cells: ['~6 sec', '~3 sec', '~0 sec', '< 0 sec'], clipId: 'flipper' },
            { label: 'Typical profit vs. Free', cells: ['1x', '1.5x', '2.6x', '5.9x'] }
        ]
    },
    {
        label: 'FLIP FINDERS',
        rows: [
            { label: 'Top 3 results in Bazaar, Craft, Fusion, Forge, Kat, Book and NPC Flips', cells: [N, Y, Y, Y], clipId: 'finders' },
            { label: 'Multi-Step Fusion Flips', cells: [N, Y, Y, Y] },
            { label: 'Top 3 Attribute Flips', cells: [N, N, Y, Y] },
            { label: 'Reverse NPC Flips', cells: [N, Y, Y, Y] },
            { label: 'Refresh Reverse NPC Flips on demand', cells: [N, N, Y, Y] },
            { label: 'Premium Bazaar Flips', cells: [N, N, Y, Y], clipId: 'bazaar' },
            { label: 'Medium-term investment flips (Mayor cycle)', cells: [N, N, Y, Y] }
        ]
    },
    {
        label: 'AUCTION FLIPPER',
        rows: [
            { label: 'Full access to flipper filters', cells: [N, Y, Y, Y], clipId: 'flipper' },
            { label: 'Filter player auctions', cells: [N, Y, Y, Y] },
            { label: 'Flip tracking history', cells: ['7 days', '7 days', '1 year', '3 years'] },
            { label: 'Replay flips', cells: [N, N, N, Y], clipId: 'replay' },
            { label: 'Browse flip block reasons', cells: [N, N, N, Y], clipId: 'blocked' },
            { label: 'Buy speed and most profit leaderboards', cells: [N, N, N, Y], clipId: 'leaderboard' }
        ]
    },
    {
        label: 'MONEY MAKING TASKS',
        rows: [
            { label: 'Top 3 of your unlocked tasks in the mod', cells: [N, Y, Y, Y] },
            { label: 'Task gear setups beyond baseline and budget', cells: [N, N, Y, Y], clipId: 'tasks' },
            { label: 'Endgame gear path to max rates', cells: [N, N, N, Y], clipId: 'tasks' }
        ]
    },
    {
        label: 'PRICES AND DATA',
        rows: [
            { label: 'Max. recent and active auctions', cells: ['12', '60', '120', '120'] },
            { label: 'Max. notifications', cells: ['3', '10', '100', '1,000'], clipId: 'notifiers' },
            { label: 'Market analysis range', cells: ['7 days', '30 days', '1 year', '1 year'] },
            { label: 'List of low supply items', cells: [N, N, Y, Y] },
            { label: 'Access to archive', cells: [N, N, N, Y], clipId: 'archive' },
            { label: 'CSV file exports', cells: [N, N, N, Y], clipId: 'archive' },
            { label: 'Bazaar data export (JSON)', cells: [N, N, '180 days', '~6 years'], clipId: 'archive' },
            { label: 'Access to BazaarPro (pro.skyblock.bz)', cells: [N, N, N, Y] },
            { label: 'API: lift an IP rate-limit ban', cells: [N, N, N, Y] }
        ]
    },
    {
        label: 'IN-GAME MOD',
        rows: [
            { label: 'Use /cofl forge in game', cells: ['Top 3 hidden', Y, Y, Y], clipId: 'commands' },
            { label: 'Refresh time of /cofl cheapmuseum', cells: ['2 h', '5 min', '2 min', '2 min'], clipId: 'commands' },
            { label: 'In-game lowball helper', cells: [N, N, Y, Y], clipId: 'lowball' },
            { label: 'Chat color', cells: ['Gray', 'White', 'Green', 'Gold'], clipId: 'chatflips', chatColors: true },
            { label: 'Settings backups (/cofl backup)', cells: ['3', '10', '10', '10'] },
            { label: 'Profit history in /cofl profit and /cofl flips', cells: ['14 days', '14 days', '1 year', '3 years'] },
            { label: 'US region connection', cells: [N, N, N, Y] },
            { label: 'Chat nickname (/cl nickname)', cells: [N, N, N, Y] }
        ]
    },
    {
        label: 'ACCOUNT AND COMMUNITY',
        rows: [
            { label: 'No ads on the website', cells: [N, Y, Y, Y] },
            { label: 'Support the project', cells: [N, Y, Y, Y] },
            { label: 'Priority feature requests', cells: [N, N, Y, Y] },
            { label: 'Discord role', cells: [N, N, Y, Y] }
        ]
    }
]

export const FREE_ON_EVERY_ACCOUNT =
    'Price history, bazaar data history, the auction explorer, player auction history, active auctions, price estimations in game and the money making task list with baseline and budget gear setups.'
