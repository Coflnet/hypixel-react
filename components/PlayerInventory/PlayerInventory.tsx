import { Card } from 'react-bootstrap'
import { convertTagToName, getMinecraftColorCodedElement, numberWithThousandsSeparators } from '../../utils/Formatter'
import styles from './PlayerInventory.module.css'
import { useEffect, useState } from 'react'
import api from '../../api/ApiHelper'
import Tooltip from '../Tooltip/Tooltip'
import { getLoadingElement } from '../../utils/LoadingUtils'

interface Props {
    onItemClick?(item: InventoryData)
}

export default function PlayerInventory(props: Props) {
    let [inventoryEntires, setInventoryEntries] = useState<InventoryData[]>([])
    let [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        api.getPlayerInventory()
            .then(entry => {
                setInventoryEntries(entry)
            })
            .finally(() => {
                setIsLoading(false)
            })
    }, [])

    function getItemEntryElement(item: InventoryData) {
        if (!item || item.itemName === null) {
            return <div className={styles.gridCell}></div>
        }
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
                            src={api.getItemImageUrl({ tag: item.tag })}
                            alt=""
                            crossOrigin="anonymous"
                            height={48}
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                                if (props.onItemClick) {
                                    props.onItemClick(item)
                                }
                            }}
                        />
                    }
                    tooltipContent={
                        <div>
                            <p>
                                <img
                                    title={convertTagToName(item.tag)}
                                    className={styles.image}
                                    src={api.getItemImageUrl(item)}
                                    alt=""
                                    crossOrigin="anonymous"
                                    height={24}
                                />
                                {getMinecraftColorCodedElement(`${item.itemName}`)}
                            </p>
                            {getMinecraftColorCodedElement(item.description, false)}
                        </div>
                    }
                />
            </div>
        )
    }

    if (isLoading) {
        return getLoadingElement()
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
