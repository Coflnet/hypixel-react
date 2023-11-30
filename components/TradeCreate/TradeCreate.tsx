import { Button, Card, Form, Modal, Spinner } from 'react-bootstrap'
import { useState } from 'react'
import api from '../../api/ApiHelper'
import ItemFilterPropertiesDisplay from '../ItemFilter/ItemFilterPropertiesDisplay'
import styles from './TradeCreate.module.css'
import AddIcon from '@mui/icons-material/AddCircleOutline'
import MinusIcon from '@mui/icons-material/RemoveCircleOutline'
import PlayerInventory from '../PlayerInventory/PlayerInventory'
import TradeCreateWantedItem from '../TradeCreateWantedItem/TradeCreateWantedItem'
import { convertTagToName, getDecimalSeparator, getMinecraftColorCodedElement, getThousandSeparator } from '../../utils/Formatter'
import { toast } from 'react-toastify'
import CircularProgress from '@mui/material/CircularProgress'
import CloseIcon from '@mui/icons-material/Close'
import { NumericFormat } from 'react-number-format'

interface Props {
    onAfterTradeCreate()
    onWindowClose()
    currentUserUUID: string
}

export default function TradeCreate(props: Props) {
    let [offer, setOffer] = useState<InventoryData>()
    let [offeredCoins, setOfferedCoins] = useState<number>(0)
    let [wantedItems, setWantedItems] = useState<WantedItem[]>([])
    let [wantedCoins, setWantedCoins] = useState<number>(0)
    let [showOfferModal, setShowOfferModal] = useState(false)
    let [showCreateWantedItemModal, setShowCreateWantedItemModal] = useState(false)
    let [isCurrentlyCreatingTrade, setIsCurrentlyCreatingTrade] = useState(false)

    function onAddWanted(newWanted: WantedItem) {
        let updatedWanted = [...wantedItems, newWanted]
        setWantedItems(updatedWanted)
    }

    function onRemoveWantedByIndex(filteredIndex: number) {
        let updatedWanted = wantedItems.filter((_, index) => index !== filteredIndex)
        setWantedItems(updatedWanted)
    }

    function onSelectOffer(newOffer: InventoryData) {
        setOffer(newOffer)
        setShowOfferModal(false)
    }

    function createTradeOffer() {
        if (props.currentUserUUID && offer) {
            let wantedItemsToSend = [...wantedItems]
            if (wantedCoins > 0) {
                let wantedCoinsItem = {
                    itemName: 'Skyblock Coins',
                    tag: 'SKYBLOCK_COIN',
                    filters: {
                        Count: wantedCoins.toString()
                    }
                } as WantedItem
                wantedItemsToSend.push(wantedCoinsItem)
            }
            setIsCurrentlyCreatingTrade(true)
            api.createTradeOffer(props.currentUserUUID, offer, wantedItemsToSend, offeredCoins).then(() => {
                toast.success('Trade successfully created')
                setIsCurrentlyCreatingTrade(false)
                props.onAfterTradeCreate()
            })
        } else {
            toast.error("Couln't create trade. Missing data.")
        }
    }

    function isButtonDisabled() {
        if (isCurrentlyCreatingTrade) {
            return true
        }
        if ((!offer || !offer.tag) && (!wantedItems || !wantedItems.length)) {
            return true
        }
        return !((offer || offeredCoins) && (wantedItems.length > 0 || wantedCoins > 0))
    }

    let selectOfferModal = (
        <Modal
            size={'lg'}
            show={showOfferModal}
            onHide={() => {
                setShowOfferModal(false)
            }}
        >
            <Modal.Header closeButton>
                <Modal.Title>Select the item you want to offer</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <PlayerInventory onItemClick={onSelectOffer} />
            </Modal.Body>
        </Modal>
    )

    let createWantedItemModal = (
        <Modal
            size={'lg'}
            show={showCreateWantedItemModal}
            onHide={() => {
                setShowCreateWantedItemModal(false)
            }}
        >
            <Modal.Header closeButton>
                <Modal.Title>Create your wanted item</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <TradeCreateWantedItem
                    onTradeOfferCreated={item => {
                        setShowCreateWantedItemModal(false)
                        onAddWanted(item)
                    }}
                />
            </Modal.Body>
        </Modal>
    )

    return (
        <>
            <Card className={styles.card}>
                <Card.Header>
                    <Card.Title>
                        Create Trade <CloseIcon style={{ float: 'right', cursor: 'pointer' }} onClick={props.onWindowClose} />
                    </Card.Title>
                </Card.Header>
                <Card.Body>
                    <div style={{ display: 'flex', justifyContent: 'space-evenly' }}>
                        <div style={{ width: '40%' }}>
                            <h2>Has</h2>
                            {offer && offer.tag ? (
                                <Card>
                                    <Card.Header>
                                        <Card.Title>
                                            <img
                                                title={convertTagToName(offer.tag)}
                                                className={styles.image}
                                                src={api.getItemImageUrl(offer)}
                                                alt=""
                                                crossOrigin="anonymous"
                                                height={24}
                                            />
                                            {offer.count !== 1 ? `${offer.count}x` : null} {getMinecraftColorCodedElement(`${offer.itemName}`)}
                                        </Card.Title>
                                    </Card.Header>
                                    <Card.Body>{getMinecraftColorCodedElement(offer.description, false)}</Card.Body>
                                </Card>
                            ) : null}
                            <p
                                onClick={() => {
                                    setShowOfferModal(true)
                                }}
                                style={{ cursor: 'pointer', marginTop: 10 }}
                            >
                                <AddIcon /> Select item you want to offer
                            </p>
                            <hr />
                            <Form.Label htmlFor="coins-have">Coins you offer:</Form.Label>
                            <NumericFormat
                                id="coins-have"
                                placeholder="Add coins you want to offer"
                                onValueChange={value => {
                                    setOfferedCoins(value.floatValue || 0)
                                }}
                                customInput={Form.Control}
                                suffix=" Coins"
                                defaultValue={0}
                                thousandSeparator={getThousandSeparator()}
                                decimalSeparator={getDecimalSeparator()}
                                allowNegative={false}
                                decimalScale={0}
                            />
                        </div>
                        <div style={{ width: '40%' }}>
                            <h2>Want</h2>
                            {wantedItems.map((wantedItem, i) => {
                                return (
                                    <Card style={{ marginBottom: '10px' }}>
                                        <Card.Header>
                                            <Card.Title>
                                                <img
                                                    title={convertTagToName(wantedItem.itemName)}
                                                    className={styles.image}
                                                    src={api.getItemImageUrl({ tag: wantedItem.tag })}
                                                    alt=""
                                                    crossOrigin="anonymous"
                                                    height={24}
                                                />
                                                {wantedItem.itemName}
                                                <span
                                                    style={{ float: 'right', color: 'red', cursor: 'pointer' }}
                                                    onClick={() => {
                                                        onRemoveWantedByIndex(i)
                                                    }}
                                                >
                                                    <MinusIcon />
                                                </span>
                                            </Card.Title>
                                        </Card.Header>
                                        {wantedItem.filters ? (
                                            <Card.Body>
                                                <ItemFilterPropertiesDisplay filter={wantedItem.filters} />
                                            </Card.Body>
                                        ) : null}
                                    </Card>
                                )
                            })}
                            <p
                                onClick={() => {
                                    setShowCreateWantedItemModal(true)
                                }}
                                style={{ cursor: 'pointer' }}
                            >
                                <AddIcon /> Add wanted item
                            </p>

                            <hr />
                            <Form.Label htmlFor="coins-want">Coins you want:</Form.Label>
                            <NumericFormat
                                id="coins-want"
                                placeholder="Add coins you want to offer"
                                onValueChange={value => {
                                    setWantedCoins(value.floatValue || 0)
                                }}
                                customInput={Form.Control}
                                suffix=" Coins"
                                defaultValue={0}
                                thousandSeparator={getThousandSeparator()}
                                decimalSeparator={getDecimalSeparator()}
                                allowNegative={false}
                                decimalScale={0}
                            />
                        </div>
                    </div>
                </Card.Body>
                <Card.Footer style={{ cursor: 'pointer' }}>
                    <Button variant="success" onClick={createTradeOffer} disabled={isButtonDisabled()}>
                        {isCurrentlyCreatingTrade ? <CircularProgress size="15px" /> : <AddIcon />} Create trade offer
                    </Button>
                </Card.Footer>
            </Card>
            {selectOfferModal}
            {createWantedItemModal}
        </>
    )
}
