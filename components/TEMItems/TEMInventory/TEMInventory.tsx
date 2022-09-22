import React, { useEffect, useState } from 'react'
import { Card } from 'react-bootstrap'
import { convertTagToName, getStyleForTier, numberWithThousandsSeperators } from '../../../utils/Formatter'
import Tooltip from '../../Tooltip/Tooltip'
import styles from './TEMInventory.module.css'

interface Props {
    title: string
    type: 'items' | 'pets'
    entries: TEM_Item[] | TEM_Pet[]
}

function TEMInventory(props: Props) {
    function getPetEntryElement(pet: TEM_Pet) {
        return (
            <div className={styles.gridCell}>
                <Tooltip
                    type="hover"
                    className={styles.hoverElement}
                    content={<img title={convertTagToName(pet.name)} className={styles.image} src={pet.icon} alt="" crossOrigin="anonymous" height={36} />}
                    tooltipContent={
                        <div>
                            <p style={{ ...getStyleForTier(pet.rarity), marginBottom: 5 }}>
                                {' '}
                                <img title={convertTagToName(pet.name)} className={styles.image} src={pet.icon} alt="" crossOrigin="anonymous" height={24} />
                                {`[Lvl ${pet.level}] ${convertTagToName(pet.name)}`}
                            </p>
                            <ul>
                                <li>Candy: {pet.candy}</li>
                                {pet.heldItem ? <li>Item: {convertTagToName(pet.heldItem)}</li> : null}
                                {pet.skin ? <li>Skin: {convertTagToName(pet.skin)}</li> : null}
                            </ul>
                        </div>
                    }
                />
            </div>
        )
    }

    function getItemEntryElement(item: TEM_Item) {
        return (
            <div className={styles.gridCell}>
                <Tooltip
                    type="hover"
                    className={styles.hoverElement}
                    hoverPlacement="bottom"
                    content={<img title={convertTagToName(item.itemId)} className={styles.image} src={item.icon} alt="" crossOrigin="anonymous" height={36} />}
                    tooltipContent={
                        <div>
                            <p style={{ ...getStyleForTier(item.rarity), marginBottom: 5 }}>
                                <img
                                    title={convertTagToName(item.itemId)}
                                    className={styles.image}
                                    src={item.icon}
                                    alt=""
                                    crossOrigin="anonymous"
                                    height={24}
                                />
                                {convertTagToName(`${item.reforge} ${item.itemId}`)}
                            </p>
                            <ul>
                                {item.extraAttributes
                                    ? Object.keys(item.extraAttributes).map(key => {
                                          if (typeof item.extraAttributes[key] === 'string') {
                                              return <li>{`${convertTagToName(key)}: ${convertTagToName(item.extraAttributes[key])}`}</li>
                                          }
                                          if (typeof item.extraAttributes[key] === 'number') {
                                              return <li>{`${convertTagToName(key)}: ${numberWithThousandsSeperators(item.extraAttributes[key])}`}</li>
                                          }
                                          return <li>{`${convertTagToName(key)}: ${item.extraAttributes[key]}`}</li>
                                      })
                                    : null}
                                {item.extraAttributes && item.enchantments ? <hr style={{ margin: '8px 0px 8px -30px' }} /> : null}
                                {item.enchantments
                                    ? Object.keys(item.enchantments).map(key => <li>{`${convertTagToName(key)}: ${item.enchantments[key]}`}</li>)
                                    : null}
                            </ul>
                        </div>
                    }
                />
            </div>
        )
    }

    return (
        <Card className={styles.card}>
            <Card.Header>
                <Card.Title>{convertTagToName(props.title)}</Card.Title>
            </Card.Header>
            <Card.Body>
                <div className={styles.inventory}>
                    <div className={styles.grid}>
                        {props.entries.map(entry => (props.type === 'items' ? getItemEntryElement(entry) : getPetEntryElement(entry)))}
                    </div>
                </div>
            </Card.Body>
        </Card>
    )
}

export default TEMInventory
