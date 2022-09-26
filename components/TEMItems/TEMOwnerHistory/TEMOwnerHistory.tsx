import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { Card } from 'react-bootstrap'
import api from '../../../api/ApiHelper'
import { getLoadingElement } from '../../../utils/LoadingUtils'
import { parsePlayer } from '../../../utils/Parser/APIResponseParser'
import styles from './TEMOwnerHistory.module.css'

interface Props {
    detailEntry: TEM_Item | TEM_Pet
}

function TEMOwnerHistory(props: Props) {
    let [currentOwner, setCurrentOwner] = useState<Player>({ name: '', uuid: '' })
    let [previousOwners, setPreviousOwners] = useState<Player[]>([])
    let [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        setIsLoading(true)

        let promises = []

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

        let prevOwners = []
        props.detailEntry.previousOwners.forEach(previousOwner => {
            api.getPlayerName(previousOwner.playerUUID).then(name => {
                prevOwners.push(
                    parsePlayer({
                        name: name,
                        uuid: previousOwner.playerUUID
                    })
                )
            })
        })

        Promise.all(promises).then(() => {
            setPreviousOwners(prevOwners)
            setIsLoading(false)
        })
    }, [])

    function getPlayerElement(player: Player) {
        return (
            <>
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
            </>
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
                                <Link href={`/player/${currentOwner.uuid}`}>
                                    <div className={styles.clickable}>
                                        {getPlayerElement(currentOwner)} <span style={{ marginLeft: '10px', color: 'lime' }}>(Current)</span>
                                    </div>
                                </Link>
                            </li>
                            {previousOwners.map(prevOwner => {
                                return (
                                    <li>
                                        <Link href={`/player/${prevOwner.uuid}`}>
                                            <div className={styles.clickable}>{getPlayerElement(prevOwner)}</div>
                                        </Link>
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
