import { Button, Card, Modal, Spinner } from 'react-bootstrap'
import { useState } from 'react'
import api from '../../api/ApiHelper'
import ItemFilterPropertiesDisplay from '../ItemFilter/ItemFilterPropertiesDisplay'
import styles from './TradeCreate.module.css'
import AddIcon from '@mui/icons-material/AddCircleOutline'
import MinusIcon from '@mui/icons-material/RemoveCircleOutline'
import PlayerInventory from '../PlayerInventory/PlayerInventory'
import TradeCreateWantedItem from '../TradeCreateWantedItem/TradeCreateWantedItem'
import { convertTagToName, getMinecraftColorCodedElement } from '../../utils/Formatter'
import { toast } from 'react-toastify'
import CircularProgress from '@mui/material/CircularProgress'
import CloseIcon from '@mui/icons-material/Close'

interface Props {
    onAfterTradeCreate()
    onWindowClose()
    currentUserUUID: string
}

export default function TradeCreate(props: Props) {
    let [offer, setOffer] = useState<InventoryData>()
    let [wantedItems, setWantedItems] = useState<WantedItem[]>([])
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
            setIsCurrentlyCreatingTrade(true)
            api.createTradeOffer(props.currentUserUUID, offer, wantedItems).then(() => {
                toast.success('Trade successfully created')
                setIsCurrentlyCreatingTrade(false)
                props.onAfterTradeCreate()
            })
        } else {
            toast.error("Couln't create trade. Missing data.")
        }
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
                            {offer ? (
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
                        </div>
                    </div>
                </Card.Body>
                <Card.Footer style={{ cursor: 'pointer' }}>
                    <Button
                        variant="success"
                        onClick={createTradeOffer}
                        disabled={!offer || !wantedItems || wantedItems.length === 0 || isCurrentlyCreatingTrade}
                    >
                        {isCurrentlyCreatingTrade ? <CircularProgress size="15px" /> : <AddIcon />} Create trade offer
                    </Button>
                </Card.Footer>
            </Card>
            {selectOfferModal}
            {createWantedItemModal}
        </>
    )
}
