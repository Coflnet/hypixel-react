import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { Card } from 'react-bootstrap'
import api from '../../../api/ApiHelper'
import { getLocalDateAndTime } from '../../../utils/Formatter'
import { getLoadingElement } from '../../../utils/LoadingUtils'
import { parsePlayer } from '../../../utils/Parser/APIResponseParser'
import styles from './TEMOwnerHistory.module.css'

interface Props {
    detailEntry: TEM_Item | TEM_Pet
}

interface PreviousOwner {
    player: Player
    start: Date
    end: Date
}

function TEMOwnerHistory(props: Props) {
    let [currentOwner, setCurrentOwner] = useState<Player>({ name: '', uuid: '' })
    let [previousOwners, setPreviousOwners] = useState<PreviousOwner[]>([])
    let [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        setIsLoading(true)

        let promises: Promise<void>[] = []

        promises.push(
            api.getPlayerName(props.detailEntry.currentOwner.playerUUID).then(name => {
                setCurrentOwner(
                    parsePlayer({
                        name: name,
                        uuid: props.detailEntry.currentOwner.playerUUID
                    })
                )
            })
        )

        let prevOwners: PreviousOwner[] = []
        props.detailEntry.previousOwners.forEach(previousOwner => {
            let promise = api.getPlayerName(previousOwner.owner.playerUUID).then(name => {
                prevOwners.push({
                    player: parsePlayer({
                        name: name,
                        uuid: previousOwner.owner.playerUUID
                    }),
                    start: previousOwner.start,
                    end: previousOwner.end
                })
            })
            promises.push(promise)
        })

        Promise.all(promises).then(() => {
            setPreviousOwners(prevOwners)
            setIsLoading(false)
        })
    }, [])

    function getPlayerElement(player: Player) {
        return (
            <div className={styles.playerElement}>
                <img
                    crossOrigin="anonymous"
                    className="playerHeadIcon"
                    src={player.iconUrl}
                    alt="player icon"
                    height="36"
                    style={{ marginRight: '10px' }}
                    loading="lazy"
                />
                {player.name}
            </div>
        )
    }

    return (
        <>
            <Card>
                <Card.Header>Owner History</Card.Header>
                <Card.Body>
                    {isLoading ? (
                        getLoadingElement()
                    ) : (
                        <ul>
                            <li>
                                <a href={`/player/${currentOwner.uuid}`} className="disableLinkStyle">
                                    <div className={styles.clickable}>
                                        {getPlayerElement(currentOwner)} <span style={{ marginLeft: '10px', color: 'lime' }}>(Current)</span>
                                    </div>
                                </a>
                            </li>
                            {previousOwners.map(prevOwner => {
                                return (
                                    <li style={{ marginTop: '15px' }}>
                                        <a href={`/player/${prevOwner.player.uuid}`} className="disableLinkStyle">
                                            <div className={styles.clickable}>
                                                {getPlayerElement(prevOwner.player)}{' '}
                                                <span style={{ marginLeft: '10px', color: 'yellow' }}>
                                                    ({prevOwner.start.toLocaleDateString()} - {prevOwner.end.toLocaleDateString()})
                                                </span>
                                            </div>
                                        </a>
                                    </li>
                                )
                            })}
                        </ul>
                    )}
                </Card.Body>
            </Card>
        </>
    )
}

export default TEMOwnerHistory
