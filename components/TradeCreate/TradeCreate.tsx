import { Button, Card, Modal } from 'react-bootstrap'
import { useEffect, useState } from 'react'
import api from '../../api/ApiHelper'
import ItemFilterPropertiesDisplay from '../ItemFilter/ItemFilterPropertiesDisplay'
import styles from './TradeCreate.module.css'
import AddIcon from '@mui/icons-material/AddCircleOutline'
import MinusIcon from '@mui/icons-material/RemoveCircleOutline'
import PlayerInventory from '../PlayerInventory/PlayerInventory'
import TradeCreateWantedItem from '../TradeCreateWantedItem/TradeCreateWantedItem'
import { convertTagToName, getMinecraftColorCodedElement } from '../../utils/Formatter'
import { getLoadingElement } from '../../utils/LoadingUtils'

export interface WantedItem {
    item: Item
    filter: ItemFilter | undefined
}

export default function TradeCreate() {
    let [accountDetails, setAccountDetails] = useState<AccountInfo>()
    let [offer, setOffer] = useState<InventoryData>()
    let [wantedItems, setWantedItems] = useState<WantedItem[]>([])
    let [showOfferModal, setShowOfferModal] = useState(false)
    let [showCreateWantedItemModal, setShowCreateWantedItemModal] = useState(false)
    let [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        api.getAccountInfo()
            .then(accountInfo => {
                setAccountDetails(accountInfo)
                setIsLoading(false)
            })
            .catch(() => {
                setIsLoading(false)
            })
    }, [])

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

    function createTradeOffer() {}

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
                    onTradeOfferCreated={(item, filter) => {
                        setShowCreateWantedItemModal(false)
                        onAddWanted({
                            item,
                            filter: filter
                        })
                    }}
                />
            </Modal.Body>
        </Modal>
    )

    if (isLoading) {
        return getLoadingElement()
    }

    return (
        <>
            <Card className={styles.card}>
                <Card.Header>
                    <Card.Title>{accountDetails?.mcName}</Card.Title>
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
                                            {getMinecraftColorCodedElement(`${offer.itemName}`)}
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
                                                    title={convertTagToName(wantedItem.item.tag)}
                                                    className={styles.image}
                                                    src={api.getItemImageUrl(wantedItem.item)}
                                                    alt=""
                                                    crossOrigin="anonymous"
                                                    height={24}
                                                />
                                                {wantedItem.item.name}
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
                                        {wantedItem.filter ? (
                                            <Card.Body>
                                                <ItemFilterPropertiesDisplay filter={wantedItem.filter} />
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
                    <Button variant="success" onClick={createTradeOffer}>
                        <AddIcon /> Create trade offer
                    </Button>
                </Card.Footer>
            </Card>
            {selectOfferModal}
            {createWantedItemModal}
        </>
    )
}
