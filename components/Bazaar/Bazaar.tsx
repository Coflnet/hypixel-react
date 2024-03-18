'use client'
import { Badge, Card, Form } from 'react-bootstrap'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList } from 'react-window'
import Image from 'next/image'
import api from '../../api/ApiHelper'
import styles from './Bazaar.module.css'
import { Number } from '../Number/Number'
import { ChangeEvent, useState } from 'react'
import { v4 as generateUUID } from 'uuid'

interface Props {
    flips: BazaarSpreadFlip[]
}

const SORT_OPTIONS: SortOption<BazaarSpreadFlip>[] = [
    {
        label: 'Profit Per Hour',
        value: 'profitPerHour',
        sortFunction: crafts => crafts.sort((a, b) => b.flip.profitPerHour - a.flip.profitPerHour)
    },
    {
        label: 'Buy Price',
        value: 'buyPrice',
        sortFunction: crafts => crafts.sort((a, b) => b.flip.buyPrice - a.flip.buyPrice)
    },
    {
        label: 'Sell Price',
        value: 'sellPrice',
        sortFunction: crafts => crafts.sort((a, b) => b.flip.sellPrice - a.flip.sellPrice)
    },
    {
        label: 'Volume',
        value: 'volume',
        sortFunction: crafts => crafts.sort((a, b) => b.flip.volume - a.flip.volume)
    }
]

const FLIP_ELEMENT_HEIGHT = 330

function Bazaar(props: Props) {
    let [flips, setFlips] = useState<BazaarSpreadFlip[]>(props.flips.map(flip => ({ ...flip, key: generateUUID() })))
    let [nameFilter, setNameFilter] = useState<string>('')
    let [orderBy, setOrderBy] = useState<SortOption<BazaarSpreadFlip>>(SORT_OPTIONS[0])
    let [showManipulated, setShowManipulated] = useState<boolean>(false)

    function onNameFilterChange(e: any) {
        setNameFilter(e.target.value)
        let newFlips = [...flips]
        newFlips.forEach(flip => {
            flip.key = generateUUID()
        })
        setFlips(newFlips)
    }

    function updateOrderBy(event: ChangeEvent<HTMLSelectElement>) {
        let selectedIndex = event.target.options.selectedIndex
        let value = event.target.options[selectedIndex].getAttribute('value')!
        let sortOption = SORT_OPTIONS.find(option => option.value === value)
        if (sortOption) {
            setOrderBy(sortOption)
        }
        let newFlips = [...flips]
        newFlips.forEach(flip => {
            flip.key = generateUUID()
        })
        setFlips(newFlips)
    }

    function onShowManipulatedChange(event: ChangeEvent<HTMLInputElement>) {
        setShowManipulated(event.target.checked)
    }

    function getBazaarFlipElement(flip: BazaarSpreadFlip, style: React.CSSProperties) {
        return (
            <div style={{ ...style, height: FLIP_ELEMENT_HEIGHT, paddingRight: 15 }}>
                <Card>
                    <Card.Header style={{ padding: '10px', display: 'flex', justifyContent: 'space-between' }}>
                        <div className="ellipse" style={{ fontSize: 'larger' }}>
                            <Image
                                crossOrigin="anonymous"
                                src={api.getItemImageUrl({ tag: flip.flip.itemTag })}
                                height="32"
                                width="32"
                                alt=""
                                style={{ marginRight: '5px' }}
                                loading="lazy"
                            />
                            {flip.itemName}
                            {flip.isManipulated && (
                                <Badge bg="danger" style={{ marginLeft: '5px' }}>
                                    Manipulated
                                </Badge>
                            )}
                        </div>
                    </Card.Header>
                    <Card.Body>
                        <Card.Text>
                            <p>
                                <span className={styles.label}>Buy Price:</span> <Number number={Math.round(flip.flip.buyPrice)} /> Coins
                            </p>
                            <p>
                                <span className={styles.label}>Sell Price:</span> <Number number={flip.flip.sellPrice} /> Coins
                            </p>
                            <p>
                                <span className={styles.label}>Profit Per Hour:</span> <Number number={flip.flip.profitPerHour} /> Coins
                            </p>
                            <p>
                                <span className={styles.label}>Volume:</span> <Number number={flip.flip.volume} />
                            </p>
                            <p>
                                <span className={styles.label}>Timestamp:</span> {new Date(flip.flip.timestamp).toLocaleString()}
                            </p>
                        </Card.Text>
                    </Card.Body>
                </Card>
            </div>
        )
    }

    let flipsToDisplay = [...flips]
    flipsToDisplay = flipsToDisplay.filter(flip => {
        if (!showManipulated && flip.isManipulated) return false
        if (nameFilter) {
            let match = flip.itemName.toLowerCase().includes(nameFilter.toLowerCase())
            if (!match) return false
        }
        return true
    })
    if (orderBy) {
        let sortOption = SORT_OPTIONS.find(option => option.value === orderBy.value)
        flipsToDisplay = sortOption?.sortFunction(flipsToDisplay)
    }

    return (
        <>
            <div>
                <div className={styles.filterInputContainer}>
                    <Form.Control className={styles.filterInput} placeholder="Item name..." onChange={onNameFilterChange} />
                    <Form.Select className={styles.filterInput} defaultValue={orderBy.value} onChange={updateOrderBy}>
                        {SORT_OPTIONS.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </Form.Select>
                    <div className={styles.filterInput} style={{ display: 'flex' }}>
                        <label htmlFor="showManipulated" style={{ whiteSpace: 'nowrap', marginRight: 10 }}>
                            Show Manipulated
                        </label>
                        <Form.Check onChange={onShowManipulatedChange} defaultChecked={showManipulated} />
                    </div>
                </div>
                <div className={styles.flipListContainer}>
                    <AutoSizer>
                        {({ height, width }) => (
                            <FixedSizeList
                                itemKey={(index, data) => {
                                    return data[index].key
                                }}
                                height={height}
                                width={width}
                                itemData={flipsToDisplay}
                                itemCount={flipsToDisplay.length}
                                itemSize={FLIP_ELEMENT_HEIGHT}
                            >
                                {({ index, style }) => {
                                    let flipToShow = flipsToDisplay[index]
                                    return getBazaarFlipElement(flipToShow, style)
                                }}
                            </FixedSizeList>
                        )}
                    </AutoSizer>
                </div>
            </div>
        </>
    )
}

export default Bazaar
