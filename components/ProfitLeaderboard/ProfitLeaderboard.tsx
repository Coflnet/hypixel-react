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

export function ProfitLeaderboardComponent() {
    let [googleId, setGoogleId] = useState<string>()
    let wasAlreadyLoggedIn = useWasAlreadyLoggedIn()
    const { data: { data: leaderboardEntries } = { data: [] } } = useGetApiLeaderboardProfit(undefined, {
        fetch: {
            headers: {
                GoogleToken: googleId || ''
            }
        },
        query: {
            enabled: !!googleId
        }
    })

    function onAfterLogin() {
        setGoogleId(sessionStorage.getItem('googleId') || '')
    }

    let description = (
        <p>
            This is the leaderboard of the skyblock ah flippers with the most profit in the last 7 days.
            <br />
            The board resets every Monday Morning and gets updated whenever the tracked flips of a player are viewed.
            <br />
            Ultime list to find skyblock bilonaires!
        </p>
    )

    if (wasAlreadyLoggedIn && !googleId) {
        return <GoogleSignIn onAfterLogin={onAfterLogin} />
    }
    if ((leaderboardEntries as any)?.slug === 'no_premium_plus' || !wasAlreadyLoggedIn || !googleId) {
        return (
            <>
                {description}
                <h2>Premium Plus Required</h2>
                <p>Seeing this list is exclusive to Premium Plus users.</p>
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
    if ((leaderboardEntries as any)?.slug) {
        return <Error title="API error while fetching profit leaderboard" errorObject={leaderboardEntries} />
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
