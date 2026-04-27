'use client'

import { useGetApiLeaderboardProfit } from '../../api/_generated/skyApi'
import { Button, Table } from 'react-bootstrap'
import Number from '../Number/Number'
import Link from 'next/link'
import { useState } from 'react'
import { useWasAlreadyLoggedIn } from '../../utils/Hooks'
import dynamic from 'next/dynamic'
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn'
import { Error } from '../Error/Error'
import { LeaderboardEntry } from '../../api/_generated/skyApi.schemas'
import { parsePlayer } from '../../utils/Parser/APIResponseParser'
import Tooltip from '../Tooltip/Tooltip'
import { type GeneratedApiResponse, getGeneratedApiErrorMessage, hasSuccessfulArrayResponse, isGeneratedPremiumPlusRequired } from '../../utils/GeneratedApiResponseUtils'

export function ProfitLeaderboardComponent() {
    let [googleId, setGoogleId] = useState<string>()
    let wasAlreadyLoggedIn = useWasAlreadyLoggedIn()
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

    function onAfterLogin() {
        setGoogleId(sessionStorage.getItem('googleId') || '')
    }

    let description = (
        <p>
            This is the leaderboard of the skyblock ah flippers with the most profit in the last 7 days.
            <br />
            The board resets every Monday Morning and gets updated whenever the tracked flips of a player are viewed.
            <br />
            Ultimate list to find skyblock billionaires!
        </p>
    )

    if (wasAlreadyLoggedIn && !googleId) {
        return <GoogleSignIn onAfterLogin={onAfterLogin} />
    }
    if (!wasAlreadyLoggedIn || !googleId || isPremiumPlusDenied) {
        return (
            <>
                {description}
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
        return <Error title="API error while fetching profit leaderboard" errorObject={apiResponse?.data} errorMessage={getGeneratedApiErrorMessage(apiResponse, query.error, 'Unable to load the profit leaderboard right now') || undefined} />
    }

    return (
        <>
            {description}
            <Table striped bordered hover responsive>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Player</th>
                        <th>Profit made</th>
                    </tr>
                </thead>
                <tbody>
                    {leaderboardEntries?.map((entry: LeaderboardEntry, index: number) => {
                        let player = parsePlayer({
                            uuid: entry.playerUuid,
                            name: entry.playerName
                        })
                        return (
                            <Tooltip
                                content={
                                    <tr key={player.uuid}>
                                        <td>{index + 1}</td>
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
            <GoogleSignIn onAfterLogin={onAfterLogin} />
        </>
    )
}

const ProfitLeaderboard = dynamic(() => import('./ProfitLeaderboard').then(mod => mod.ProfitLeaderboardComponent), { ssr: false })

export default ProfitLeaderboard
