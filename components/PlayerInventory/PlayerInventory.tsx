import { Card } from 'react-bootstrap'
import { convertTagToName, getMinecraftColorCodedElement, numberWithThousandsSeparators, removeMinecraftColorCoding } from '../../utils/Formatter'
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

    function isItemSouldbound(item: InventoryData) {
        return item.description?.includes('§8§l* §8Co-op Soulbound §8§l*') || item.description?.includes('§8§l* §8Soulbound §8§l*')
    }

    function getItemEntryElement(item: InventoryData) {
        if (!item || item.itemName === null) {
            return <div className={styles.gridCell}></div>
        }

        let isSouldbound = isItemSouldbound(item)
        let isTradeable = !isSouldbound && item.tag !== 'SKYBLOCK_MENU'
        return (
            <div className={styles.gridCell}>
                <div style={{ position: 'relative', height: '100%' }}>
                    <Tooltip
                        type="hover"
                        className={styles.hoverElement}
                        hoverPlacement="bottom"
                        id={styles.tooltipHoverId}
                        content={
                            <img
                                title={removeMinecraftColorCoding(item.itemName)}
                                className={styles.image}
                                src={api.getItemImageUrl({ tag: item.tag })}
                                alt=""
                                crossOrigin="anonymous"
                                height={48}
                                style={isTradeable ? { cursor: 'pointer', position: 'absolute', top: 0, left: 0 } : {}}
                                onClick={() => {
                                    if (!isTradeable) {
                                        return
                                    }
                                    if (props.onItemClick) {
                                        props.onItemClick(item)
                                    }
                                }}
                            />
                        }
                        tooltipContent={
                            <div style={{ maxWidth: '100%' }}>
                                {isSouldbound ? <p>{getMinecraftColorCodedElement(`§4§lNot tradeable - Item is Soulbound`)}</p> : null}
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
                    {item.count !== 1 ? (
                        <span style={{ position: 'absolute', fontWeight: 'bold', bottom: 0, right: 0, fontSize: '24px' }}>{item.count}</span>
                    ) : null}
                </div>
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
