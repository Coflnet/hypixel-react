import { LeaderboardEntry } from './_generated/skyApi.schemas'

/**
 * Public (no auth) fetch for the profit leaderboard.
 * Uses weekOffset=-1 to get last week's places 100–150 without authentication.
 * @returns Leaderboard entries (places 100–150 of last week)
 */
export async function getPublicLeaderboardProfit(): Promise<{ data: LeaderboardEntry[]; status: number }> {
    const url = 'https://sky.coflnet.com/api/leaderboard/profit?weekOffset=-1'

    const res = await fetch(url, { method: 'GET' })
    const body = [204, 205, 304].includes(res.status) ? null : await res.text()
    const data: LeaderboardEntry[] = body ? JSON.parse(body) : []
    return { data, status: res.status }
}
