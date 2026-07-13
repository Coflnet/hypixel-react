'use client'

import { useGetApiLeaderboardProfit } from '../../api/_generated/skyApi'
import { useQuery } from '@tanstack/react-query'
import { Button, Table } from 'react-bootstrap'
import Number from '../Number/Number'
import Link from 'next/link'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn'
import { Error } from '../Error/Error'
import { LeaderboardEntry } from '../../api/_generated/skyApi.schemas'
import { parsePlayer } from '../../utils/Parser/APIResponseParser'
import Tooltip from '../Tooltip/Tooltip'
import {
    type GeneratedApiResponse,
    getGeneratedApiErrorMessage,
    hasSuccessfulArrayResponse,
    isGeneratedPremiumPlusRequired
} from '../../utils/GeneratedApiResponseUtils'
import { getPublicLeaderboardProfit } from '../../api/skyApiPublic'

function LeaderboardTable(props: { entries: LeaderboardEntry[]; startRank?: number }) {
    let startRank = props.startRank || 1
    return (
        <Table striped bordered hover responsive>
            <thead>
                <tr>
                    <th>#</th>
                    <th>Player</th>
                    <th>Profit made</th>
                </tr>
            </thead>
            <tbody>
                {props.entries.map((entry: LeaderboardEntry, index: number) => {
                    let player = parsePlayer({
                        uuid: entry.playerUuid,
                        name: entry.playerName
                    })
                    return (
                        <Tooltip
                            content={
                                <tr key={player.uuid}>
                                    <td>{startRank + index}</td>
                                    <td>
                                        {player.iconUrl && (
                                            <img
                                                crossOrigin="anonymous"
                                                className="playerHeadIcon"
                                                src={player.iconUrl}
                                                alt={`${player.name}'s avatar`}
                                                style={{ marginRight: '10px', cursor: 'pointer' }}
                                                width={32}
                                                height={32}
                                            />
                                        )}
                                        <Link href={`/player/${player.uuid}/flips`}>{player.name}</Link>
                                    </td>
                                    <td>
                                        <Number number={entry.score} />
                                    </td>
                                </tr>
                            }
                            type="hover"
                            tooltipContent={
                                <span>
                                    Last updated: <br />
                                    {new Date(entry.timeStamp).toLocaleString()}
                                </span>
                            }
                        />
                    )
                })}
            </tbody>
        </Table>
    )
}

export function ProfitLeaderboardComponent() {
    let [googleId, setGoogleId] = useState<string>()
    const query = useGetApiLeaderboardProfit(undefined, {
        fetch: {
            headers: {
                GoogleToken: googleId || ''
            }
        },
        query: {
            enabled: !!googleId,
            retry: false
        }
    })
    const response = query.data
    const apiResponse = response as GeneratedApiResponse<LeaderboardEntry[] | { slug?: string } | string> | undefined
    const leaderboardEntries = hasSuccessfulArrayResponse<LeaderboardEntry>(response) ? response.data : []
    const isPremiumPlusDenied = apiResponse?.status === 401 || apiResponse?.status === 403 || isGeneratedPremiumPlusRequired(apiResponse?.data)
    const accessMessage = isPremiumPlusDenied
        ? getGeneratedApiErrorMessage(apiResponse, query.error, 'Seeing this list is exclusive to Premium Plus users.')
        : null

    let isNotLoggedIn = !googleId
    const publicLeaderboardQuery = useQuery({
        queryKey: ['publicLeaderboardProfit'],
        queryFn: getPublicLeaderboardProfit,
        enabled: isNotLoggedIn || isPremiumPlusDenied
    })
    const publicLeaderboardEntries = publicLeaderboardQuery.data?.status === 200 ? publicLeaderboardQuery.data.data : []

    function onAfterLogin() {
        setGoogleId(sessionStorage.getItem('googleId') || '')
    }

    let description = (
        <p>
            Compare your weekly trading profit against the top Hypixel SkyBlock flippers. Discover the best traders, study their strategies, and copy trade the
            most consistent earners.
            <br />
            The board resets every Monday morning and updates whenever a player&apos;s tracked flips are viewed. The current week&apos;s top 50 are displayed
            here with Premium+ — without Premium+ you&apos;ll see a public sample of last week&apos;s leaderboard instead (places 100–150).
            <br />
            Want to see your own rank? Use <code>/cofl lb</code> in the{' '}
            <a href="/mod" target="_blank" rel="noopener noreferrer">
                SkyCofl mod
            </a>{' '}
            — it works even without premium.
        </p>
    )

    function publicSample(reason: string) {
        return (
            <>
                <p>
                    <i>
                        {reason} you&apos;re seeing a public sample of last week&apos;s leaderboard (places 100–150). Sign in with Premium+ to see this
                        week&apos;s live top 50.
                    </i>
                </p>
                {publicLeaderboardQuery.isLoading && <p>Loading public leaderboard…</p>}
                {publicLeaderboardQuery.isSuccess && publicLeaderboardEntries.length > 0 && (
                    <LeaderboardTable entries={publicLeaderboardEntries} startRank={101} />
                )}
            </>
        )
    }

    if (isNotLoggedIn) {
        return (
            <>
                {description}
                {publicSample("You're not signed in, so")}
                <h2>Premium Plus Required</h2>
                <p>Seeing the full, up to date top 50 is exclusive to Premium Plus users.</p>
                <Link href="/premium?tier=premium_plus" className="disableLinkStyle">
                    <Button>Get Premium+</Button>
                </Link>
                <p style={{ margin: '10px' }}>or</p>
                <Link href="/" className="disableLinkStyle">
                    <Button>Return to main page</Button>
                </Link>
                <hr />
                <p>If you already have prem+ sign in here to unlock the list</p>
                <GoogleSignIn onAfterLogin={onAfterLogin} />
            </>
        )
    }
    if (isPremiumPlusDenied) {
        return (
            <>
                {description}
                {publicSample("You don't have Premium+, so")}
                <h2>Premium Plus Required</h2>
                <p>{accessMessage || 'Seeing this list is exclusive to Premium Plus users.'}</p>
                <Link href="/premium?tier=premium_plus" className="disableLinkStyle">
                    <Button>Get Premium+</Button>
                </Link>
                <p style={{ margin: '10px' }}>or</p>
                <Link href="/" className="disableLinkStyle">
                    <Button>Return to main page</Button>
                </Link>
                <hr />
                <p>If you already have prem+ sign in here to unlock the list</p>
                <GoogleSignIn onAfterLogin={onAfterLogin} />
            </>
        )
    }
    if (query.isLoading && !response) {
        return (
            <>
                {description}
                <p>Loading profit leaderboard…</p>
            </>
        )
    }
    if (!hasSuccessfulArrayResponse<LeaderboardEntry>(response)) {
        return (
            <Error
                title="API error while fetching profit leaderboard"
                errorObject={apiResponse?.data}
                errorMessage={getGeneratedApiErrorMessage(apiResponse, query.error, 'Unable to load the profit leaderboard right now') || undefined}
            />
        )
    }

    return (
        <>
            {description}
            <LeaderboardTable entries={leaderboardEntries} />
            <GoogleSignIn onAfterLogin={onAfterLogin} />
        </>
    )
}

const ProfitLeaderboard = dynamic(() => import('./ProfitLeaderboard').then(mod => mod.ProfitLeaderboardComponent), { ssr: false })

export default ProfitLeaderboard
