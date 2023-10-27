import { Card } from 'react-bootstrap'
import { convertTagToName, numberWithThousandsSeparators } from '../../utils/Formatter'
import styles from './PlayerInventory.module.css'
import { useEffect, useState } from 'react'
import api from '../../api/ApiHelper'
import Tooltip from '../Tooltip/Tooltip'

interface Props {
    onItemClick?(InventoryData)
}

export default function PlayerInventory(props: Props) {
    let [inventoryEntires, setInventoryEntries] = useState<InventoryData[]>([])

    useEffect(() => {
        /* 
        Endpoint is not working yet
        
        api.getPlayerInventory().then(entry => {
            setInventoryEntries(entry)
        }) */
    })

    function getItemEntryElement(item: InventoryData) {
        return (
            <div className={styles.gridCell}>
                <Tooltip
                    type="hover"
                    className={styles.hoverElement}
                    hoverPlacement="bottom"
                    content={
                        <img
                            title={convertTagToName(item.itemName)}
                            className={styles.image}
                            src={item.icon}
                            alt=""
                            crossOrigin="anonymous"
                            height={48}
                            onClick={() => {
                                if (props.onItemClick) {
                                    props.onItemClick(item)
                                }
                            }}
                        />
                    }
                    tooltipContent={
                        <div>
                            <p style={{ color: `#${item.color.toString(16)}`, marginBottom: 5 }}>
                                <img
                                    title={convertTagToName(item.tag)}
                                    className={styles.image}
                                    src={api.getItemImageUrl(item)}
                                    alt=""
                                    crossOrigin="anonymous"
                                    height={24}
                                />
                                {convertTagToName(`${item.itemName}`)}
                            </p>
                            <ul>
                                {item.extraAttributes
                                    ? Object.keys(item.extraAttributes).map(key => {
                                          if (typeof item.extraAttributes[key] === 'string') {
                                              return <li>{`${convertTagToName(key)}: ${convertTagToName(item.extraAttributes[key])}`}</li>
                                          }
                                          if (!isNaN(parseInt(item.extraAttributes[key]))) {
                                              return (
                                                  <li>{`${convertTagToName(key)}: ${numberWithThousandsSeparators(parseInt(item.extraAttributes[key]))}`}</li>
                                              )
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
                <Card.Title>Your Items</Card.Title>
            </Card.Header>
            <Card.Body>
                <div className={styles.inventory}>
                    <div className={styles.grid}>{inventoryEntires.map(entry => getItemEntryElement(entry))}</div>
                </div>
            </Card.Body>
        </Card>
    )
}
