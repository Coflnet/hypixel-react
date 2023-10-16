import Link from 'next/link'
import React from 'react'
import { Badge, Card } from 'react-bootstrap'
import { convertTagToName, getStyleForTier, numberWithThousandsSeparators } from '../../../utils/Formatter'
import TEMOwnerHistory from '../TEMOwnerHistory/TEMOwnerHistory'
import styles from './TEMItemDetails.module.css'

interface Props {
    detailEntry: TEM_Item | TEM_Pet
    type: 'pet' | 'item'
}

function TEMItemDetails(props: Props) {
    function getDateString(date: Date) {
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
                            <Badge bg="primary">Candy</Badge>
                        </span>
                        {pet.candy}
                    </p>
                    {pet.heldItem ? (
                        <p>
                            <span className={styles.label}>
                                <Badge bg="primary">Item</Badge>
                            </span>
                            {convertTagToName(pet.heldItem)}
                        </p>
                    ) : null}
                    {pet.skin ? (
                        <p>
                            <span className={styles.label}>
                                <Badge bg="primary">Skin</Badge>
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
                            <Badge bg="primary">ID</Badge>
                        </span>
                        {item.id}
                    </p>
                    <p>
                        <span className={styles.label}>
                            <Badge bg="primary">Color</Badge>
                        </span>
                        {item.colour}
                    </p>
                    <p>
                        <span className={styles.label}>
                            <Badge bg="primary">Created</Badge>
                        </span>
                        {getDateString(item.created)}
                    </p>
                    <p>
                        <span className={styles.label}>
                            <Badge bg="primary">Last checked</Badge>
                        </span>
                        {getDateString(item.lastChecked)}
                    </p>
                    <p>
                        <span className={styles.label}>
                            <Badge bg="primary">Start</Badge>
                        </span>
                        {getDateString(item.start)}
                    </p>

                    {item.extraAttributes
                        ? Object.keys(item.extraAttributes).map(key => {
                              if (typeof item.extraAttributes[key] === 'string') {
                                  return (
                                      <p>
                                          <span className={styles.label}>
                                              <Badge bg="primary">{convertTagToName(key)}</Badge>
                                          </span>
                                          <span>{`${convertTagToName(item.extraAttributes[key])}`}</span>
                                      </p>
                                  )
                              }
                              if (typeof item.extraAttributes[key] === 'number') {
                                  return (
                                      <p>
                                          <span className={styles.label}>
                                              <Badge bg="primary">{convertTagToName(key)}</Badge>
                                          </span>
                                          {`${numberWithThousandsSeparators(item.extraAttributes[key])}`}
                                      </p>
                                  )
                              }
                              return (
                                  <p>
                                      <span className={styles.label}>
                                          <Badge bg="primary">{convertTagToName(key)}</Badge>
                                      </span>
                                      {`${item.extraAttributes[key]}`}
                                  </p>
                              )
                          })
                        : null}
                    {item.enchantments ? (
                        <p>
                            <span className={styles.label}>
                                <Badge bg="primary">Enchantments:</Badge>
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

    return (
        <>
            <Card style={{ marginBottom: '15px' }}>
                <Card.Header>{getHeader()}</Card.Header>
                <Card.Body>{getInfoBody()}</Card.Body>
            </Card>
            <TEMOwnerHistory detailEntry={props.detailEntry} />
        </>
    )
}

export default TEMItemDetails
