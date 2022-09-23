import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { Badge, Card } from 'react-bootstrap'
import api from '../../../api/ApiHelper'
import { convertTagToName, getStyleForTier, numberWithThousandsSeperators } from '../../../utils/Formatter'
import { getLoadingElement } from '../../../utils/LoadingUtils'
import { parsePlayer } from '../../../utils/Parser/APIResponseParser'
import styles from './TEMItemDetails.module.css'

interface Props {
    detailEntry: TEM_Item | TEM_Pet
    type: 'pet' | 'item'
}

function TEMItemDetails(props: Props) {
    let [currentOwner, setCurrentOwner] = useState<Player>({})
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

    function getDateString(date: Date) {
        console.log(typeof date)
        if (!date) {
            return '-'
        }
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
    }

    function getHeader() {
        if (props.type === 'pet') {
            let pet = props.detailEntry as TEM_Pet
            return (
                <Link href={`/item/PET_${pet.name}`} className={styles.clickable}>
                    <Card.Title style={{ ...getStyleForTier(pet.rarity), marginBottom: 5 }}>
                        {' '}
                        <img title={convertTagToName(pet.name)} src={pet.icon} alt="" crossOrigin="anonymous" height={24} />
                        {`[Lvl ${pet.level}] ${convertTagToName(pet.name)}`}
                    </Card.Title>
                </Link>
            )
        }
        if (props.type === 'item') {
            let item = props.detailEntry as TEM_Item
            return (
                <Link href={`/item/${item.itemId}`} className={styles.clickable}>
                    <Card.Title style={{ ...getStyleForTier(item.rarity), marginBottom: 5 }}>
                        <img title={convertTagToName(item.itemId)} src={item.icon} alt="" crossOrigin="anonymous" height={24} />
                        {convertTagToName(`${item.reforge} ${item.itemId}`)}
                    </Card.Title>
                </Link>
            )
        }
    }

    function getInfoBody() {
        if (props.type === 'pet') {
            let pet = props.detailEntry as TEM_Pet
            return (
                <div style={{ float: 'left' }}>
                    <p>
                        <span className={styles.label}>
                            <Badge variant="primary">Candy</Badge>
                        </span>
                        {pet.candy}
                    </p>
                    {pet.heldItem ? (
                        <p>
                            <span className={styles.label}>
                                <Badge variant="primary">Item</Badge>
                            </span>
                            {convertTagToName(pet.heldItem)}
                        </p>
                    ) : null}
                    {pet.skin ? (
                        <p>
                            <span className={styles.label}>
                                <Badge variant="primary">Skin</Badge>
                            </span>
                            {convertTagToName(pet.skin)}
                        </p>
                    ) : null}
                </div>
            )
        }
        if (props.type === 'item') {
            let item = props.detailEntry as TEM_Item
            return (
                <div style={{ float: 'left' }}>
                    <p>
                        <span className={styles.label}>
                            <Badge variant="primary">ID</Badge>
                        </span>
                        {item.id}
                    </p>
                    <p>
                        <span className={styles.label}>
                            <Badge variant="primary">Color</Badge>
                        </span>
                        {item.colour}
                    </p>
                    <p>
                        <span className={styles.label}>
                            <Badge variant="primary">Created</Badge>
                        </span>
                        {getDateString(item.created)}
                    </p>
                    <p>
                        <span className={styles.label}>
                            <Badge variant="primary">Last checked</Badge>
                        </span>
                        {getDateString(item.lastChecked)}
                    </p>
                    <p>
                        <span className={styles.label}>
                            <Badge variant="primary">Start</Badge>
                        </span>
                        {getDateString(item.start)}
                    </p>

                    {item.extraAttributes
                        ? Object.keys(item.extraAttributes).map(key => {
                              if (typeof item.extraAttributes[key] === 'string') {
                                  return (
                                      <p>
                                          <span className={styles.label}>
                                              <Badge variant="primary">{convertTagToName(key)}</Badge>
                                          </span>
                                          <span>{`${convertTagToName(item.extraAttributes[key])}`}</span>
                                      </p>
                                  )
                              }
                              if (typeof item.extraAttributes[key] === 'number') {
                                  return (
                                      <p>
                                          <span className={styles.label}>
                                              <Badge variant="primary">{convertTagToName(key)}</Badge>
                                          </span>
                                          {`${numberWithThousandsSeperators(item.extraAttributes[key])}`}
                                      </p>
                                  )
                              }
                              return (
                                  <p>
                                      <span className={styles.label}>
                                          <Badge variant="primary">{convertTagToName(key)}</Badge>
                                      </span>
                                      {`${item.extraAttributes[key]}`}
                                  </p>
                              )
                          })
                        : null}
                    {item.enchantments ? (
                        <p>
                            <span className={styles.label}>
                                <Badge variant="primary">Enchantments:</Badge>
                            </span>
                            <ul style={{ float: 'left' }}>
                                {item.enchantments
                                    ? Object.keys(item.enchantments).map(key => <li>{`${convertTagToName(key)}: ${item.enchantments[key]}`}</li>)
                                    : null}
                            </ul>
                        </p>
                    ) : null}
                </div>
            )
        }
    }

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
            <Card style={{ marginBottom: '15px' }}>
                <Card.Header>{getHeader()}</Card.Header>
                <Card.Body>{isLoading ? getLoadingElement() : getInfoBody()}</Card.Body>
            </Card>
            <Card>
                <Card.Header>Owner History</Card.Header>
                <Card.Body>
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
                </Card.Body>
            </Card>
        </>
    )
}

export default TEMItemDetails
