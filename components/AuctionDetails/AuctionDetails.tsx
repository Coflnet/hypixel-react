/* eslint-disable jsx-a11y/anchor-is-valid */
import HelpIcon from '@mui/icons-material/Help'
import moment from 'moment'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Badge, Button, Card, ListGroup, Modal, OverlayTrigger, Tooltip as TooltipBootstrap } from 'react-bootstrap'
import Countdown from 'react-countdown'
import { toast } from 'react-toastify'
import { v4 as generateUUID } from 'uuid'
import api from '../../api/ApiHelper'
import {
    convertTagToName,
    formatDungeonStarsInString as getDungeonStarFormattedItemName,
    getMinecraftColorCodedElement,
    getStyleForTier,
    numberWithThousandsSeparators
} from '../../utils/Formatter'
import { useForceUpdate } from '../../utils/Hooks'
import { getLoadingElement } from '../../utils/LoadingUtils'
import { isClientSideRendering } from '../../utils/SSRUtils'
import { CopyButton } from '../CopyButton/CopyButton'
import FlipBased from '../Flipper/FlipBased/FlipBased'
import SubscribeButton from '../SubscribeButton/SubscribeButton'
import Tooltip from '../Tooltip/Tooltip'
import styles from './AuctionDetails.module.css'

interface Props {
    auctionUUID: string
    auctionDetails?: AuctionDetails
    retryCounter?: number
}

function AuctionDetails(props: Props) {
    let [isNoAuctionFound, setIsNoAuctionFound] = useState(false)
    let [auctionDetails, setAuctionDetails] = useState<AuctionDetails | undefined>(props.auctionDetails)
    let [isLoading, setIsLoading] = useState(false)
    let [showBasedOnDialog, setShowBasedOnDialog] = useState(false)
    let forceUpdate = useForceUpdate()

    useEffect(() => {
        if (!props.auctionUUID || !props.auctionDetails) {
            return
        }
        loadAuctionDetails(props.auctionUUID!)
    }, [props.auctionUUID])

    let tryNumber = 1
    function loadAuctionDetails(auctionUUID: string) {
        setIsLoading(true)
        api.getAuctionDetails(auctionUUID)
            .then(auctionDetails => {
                auctionDetails.bids.sort((a, b) => b.amount - a.amount)
                auctionDetails.auction.item.iconUrl = api.getItemImageUrl(auctionDetails.auction.item)
                setAuctionDetails(auctionDetails)
                api.getItemDetails(auctionDetails.auction.item.tag).then(item => {
                    if (!auctionDetails.auction.item.name) {
                        auctionDetails.auction.item.name = item.name
                    }
                    setAuctionDetails(auctionDetails)
                    forceUpdate()
                })

                let namePromises: Promise<void>[] = []
                auctionDetails.bids.forEach(bid => {
                    let promise = api.getPlayerName(bid.bidder.uuid).then(name => {
                        bid.bidder.name = name
                    })
                    namePromises.push(promise)
                })
                namePromises.push(
                    api.getPlayerName(auctionDetails.auctioneer.uuid).then(name => {
                        auctionDetails.auctioneer.name = name
                    })
                )
                Promise.all(namePromises).then(() => {
                    forceUpdate()
                    setIsLoading(false)
                })
            })
            .catch(error => {
                setIsLoading(false)
                if (tryNumber < (props.retryCounter || 5)) {
                    tryNumber++
                    setTimeout(() => {
                        loadAuctionDetails(auctionUUID)
                    }, 2000)
                } else {
                    setIsNoAuctionFound(true)
                    if (error) {
                        toast.error(error.message)
                    }
                }
            })
    }

    let isRunning = (auctionDetails: AuctionDetails) => {
        return auctionDetails.auction.end.getTime() >= Date.now() && !(auctionDetails.auction.bin && auctionDetails.bids.length > 0)
    }

    let getTimeToolTipString = () => {
        if (!auctionDetails) {
            return ''
        }

        if (auctionDetails?.auction.bin && auctionDetails.auction.highestBid > 0 && auctionDetails.bids.length > 0) {
            return moment(auctionDetails.bids[0].timestamp).format('MMMM Do YYYY, h:mm:ss a')
        }
        return moment(auctionDetails.auction.end).format('MMMM Do YYYY, h:mm:ss a')
    }

    function getNBTElement(): JSX.Element {
        return !auctionDetails?.nbtData ? (
            <div />
        ) : (
            <div>
                {Object.keys(auctionDetails?.nbtData).map(key => {
                    let currentNBT = auctionDetails?.nbtData[key]
                    return (
                        <div key={key}>
                            <p>
                                <span className={styles.label}>
                                    <Badge variant={labelBadgeVariant}>{convertTagToName(key)}:</Badge>
                                </span>
                                <div className="ellipse">{formatNBTValue(key, currentNBT)}</div>
                            </p>
                        </div>
                    )
                })}
            </div>
        )
    }

    function formatNBTValue(key: string, value: any) {
        let tagNbt = [
            'heldItem',
            'personal_compact_0',
            'personal_compact_1',
            'personal_compact_2',
            'personal_compact_3',
            'personal_compact_4',
            'personal_compact_5',
            'personal_compact_6',
            'personal_compact_7',
            'personal_compact_8',
            'personal_compact_9',
            'personal_compact_10',
            'personal_compact_11',
            'personal_compactor_0',
            'personal_compactor_1',
            'personal_compactor_2',
            'personal_compactor_3',
            'personal_compactor_4',
            'personal_compactor_5',
            'personal_compactor_6',
            'personal_deletor_0',
            'personal_deletor_1',
            'personal_deletor_2',
            'personal_deletor_3',
            'personal_deletor_4',
            'personal_deletor_5',
            'personal_deletor_6',
            'personal_deletor_7',
            'personal_deletor_8',
            'personal_deletor_9',
            'last_potion_ingredient',
            'power_ability_scroll',
            'skin'
        ]

        if (key === 'rarity_upgrades') {
            if (value === '0') {
                return 'false'
            }
            if (value === '1') {
                return 'true'
            }
            return value
        }

        if (key === 'color') {
            let decSplits = value ? value.split(':') : []
            let hexSplits: string[] = []
            decSplits.forEach(split => {
                hexSplits.push(parseInt(split).toString(16).padStart(2, '0'))
            })
            return <Tooltip type="hover" content={<span>{hexSplits.join('')}</span>} tooltipContent={value} />
        }

        if (!isNaN(value) && Number.isInteger(parseInt(value, 10))) {
            return numberWithThousandsSeparators(value)
        }

        let index = tagNbt.findIndex(tag => tag === key)
        if (index !== -1) {
            if(key === 'skin'){
                return <Link href={'/item/PET_SKIN_' + value}>{convertTagToName(value)}</Link>
            }
            return <Link href={'/item/' + value}>{convertTagToName(value)}</Link>
        }
        return value.toString()
    }

    const labelBadgeVariant = 'primary'
    const binBadgeVariant = 'success'
    const countBadgeVariant = 'dark'

    let basedOnDialog = showBasedOnDialog ? (
        <Modal
            size={'xl'}
            show={showBasedOnDialog}
            onHide={() => {
                setShowBasedOnDialog(null)
            }}
        >
            <Modal.Header closeButton>
                <Modal.Title>Similar auctions from the past</Modal.Title>
            </Modal.Header>
            <Modal.Body>{auctionDetails ? <FlipBased auctionUUID={auctionDetails.auction.uuid} item={auctionDetails.auction.item} /> : null}</Modal.Body>
        </Modal>
    ) : null

    let auctionCardContent = !auctionDetails ? (
        getLoadingElement()
    ) : (
        <div>
            <Card.Header className={styles.auctionCardHeader}>
                <Link href={'/item/' + auctionDetails.auction.item.tag}>
                    <a className="disableLinkStyle">
                        <h1>
                            <span className={styles.itemIcon}>
                                <img crossOrigin="anonymous" src={auctionDetails?.auction.item.iconUrl} height="48" alt="item icon" loading="lazy" />
                            </span>
                            <span style={{ paddingLeft: '10px', display: 'flex', justifyContent: 'center' }}>
                                <span style={{ marginRight: '10px' }}>
                                    {auctionDetails?.auction.item.name?.includes('§')
                                        ? getMinecraftColorCodedElement(auctionDetails?.auction.item.name)
                                        : getDungeonStarFormattedItemName(
                                              auctionDetails?.auction.item.name,
                                              getStyleForTier(auctionDetails.auction.item.tier),
                                              auctionDetails?.nbtData['dungeon_item_level']
                                          )}
                                </span>
                                <Badge variant={countBadgeVariant} style={{ marginLeft: '5px' }}>
                                    x{auctionDetails?.count}
                                </Badge>
                                {auctionDetails.auction.bin ? (
                                    <Badge variant={binBadgeVariant} style={{ marginLeft: '5px' }}>
                                        BIN
                                    </Badge>
                                ) : (
                                    ''
                                )}
                            </span>
                        </h1>
                    </a>
                </Link>
                <div className={styles.cardHeadSubtext}>
                    <OverlayTrigger
                        overlay={<TooltipBootstrap id={generateUUID()}>{getTimeToolTipString()}</TooltipBootstrap>}
                        children={
                            <div>
                                {isRunning(auctionDetails) ? (
                                    <span>
                                        End: {auctionDetails?.auction.end ? <Countdown date={auctionDetails.auction.end} onComplete={forceUpdate} /> : '-'}
                                    </span>
                                ) : (
                                    <span>
                                        Auction ended{' '}
                                        {auctionDetails.auction.bin && auctionDetails.bids.length > 0
                                            ? moment(auctionDetails.bids[0].timestamp).fromNow()
                                            : moment(auctionDetails.auction.end).fromNow()}
                                    </span>
                                )}
                            </div>
                        }
                    ></OverlayTrigger>
                    {isRunning(auctionDetails) ? (
                        <div>
                            <SubscribeButton
                                type="auction"
                                topic={auctionDetails.auction.uuid}
                                buttonContent={<span className={styles.topRowButtonContent}>Notify</span>}
                            />
                        </div>
                    ) : (
                        ''
                    )}
                    <CopyButton
                        buttonVariant="primary"
                        copyValue={
                            isRunning(auctionDetails)
                                ? '/viewauction ' + auctionDetails.auction.uuid
                                : isClientSideRendering()
                                ? `${location.origin}/auction/${auctionDetails.auction.uuid}`
                                : ''
                        }
                        successMessage={
                            isRunning(auctionDetails) ? (
                                <p>
                                    Copied ingame link <br />
                                    <i>/viewauction {auctionDetails.auction.uuid}</i>
                                </p>
                            ) : (
                                <p>Copied link to clipboard</p>
                            )
                        }
                        buttonContent={<span className={styles.topRowButtonContent}>Copy</span>}
                    />
                    <Button
                        onClick={() => {
                            setShowBasedOnDialog(true)
                        }}
                    >
                        <HelpIcon />
                        <span className={styles.topRowButtonContent}>Compare to ended auctions</span>
                    </Button>
                </div>
            </Card.Header>
            <Card.Body>
                <p>
                    <span className={styles.label}>
                        <Badge variant={labelBadgeVariant}>Tier:</Badge>
                    </span>
                    <span style={getStyleForTier(auctionDetails.auction.item.tier)}>{auctionDetails?.auction.item.tier}</span>
                </p>
                <p>
                    <span className={styles.label}>
                        <Badge variant={labelBadgeVariant}>Category:</Badge>
                    </span>{' '}
                    {convertTagToName(auctionDetails?.auction.item.category)}
                </p>
                <p>
                    <span className={styles.label}>
                        <Badge variant={labelBadgeVariant}>Reforge:</Badge>
                    </span>
                    {auctionDetails?.reforge}
                </p>

                <Link href={`/player/${auctionDetails.auctioneer.uuid}`}>
                    <a>
                        <p>
                            <span className={styles.label}>
                                <Badge variant={labelBadgeVariant}>Auctioneer:</Badge>
                            </span>
                            {auctionDetails?.auctioneer.name}
                            <img
                                crossOrigin="anonymous"
                                className="playerHeadIcon"
                                src={auctionDetails?.auctioneer.iconUrl}
                                alt="auctioneer icon"
                                height="16"
                                style={{ marginLeft: '5px' }}
                                loading="lazy"
                            />
                        </p>
                    </a>
                </Link>

                <p>
                    <span className={styles.label}>
                        <Badge variant={labelBadgeVariant}>Auction Created:</Badge>
                    </span>
                    {auctionDetails?.start.toLocaleDateString() + ' ' + auctionDetails.start.toLocaleTimeString()}
                </p>
                <p>
                    <span className={styles.label}>
                        <Badge variant={labelBadgeVariant}>Item Created:</Badge>
                    </span>
                    {auctionDetails?.itemCreatedAt.toLocaleDateString() + ' ' + auctionDetails.itemCreatedAt.toLocaleTimeString()}
                </p>

                <div style={{ overflow: 'auto' }}>
                    <span className={auctionDetails && auctionDetails!.enchantments.length > 0 ? styles.labelForList : styles.label}>
                        <Badge variant={labelBadgeVariant}>Enchantments:</Badge>
                    </span>
                    {auctionDetails && auctionDetails!.enchantments.length > 0 ? (
                        <ul className={styles.list}>
                            {auctionDetails?.enchantments.map(enchantment => {
                                let enchantmentString = <span>{enchantment.name}</span>
                                if (enchantment.color) {
                                    enchantmentString = getMinecraftColorCodedElement(enchantment.color + enchantment.name + ' ' + enchantment.level)
                                }
                                return enchantment.name ? <li key={enchantment.name}>{enchantmentString}</li> : ''
                            })}
                        </ul>
                    ) : (
                        <p>None</p>
                    )}
                </div>
                <div>{getNBTElement()}</div>
            </Card.Body>
        </div>
    )

    let bidList =
        auctionDetails?.bids.length === 0 ? (
            <p>No bids</p>
        ) : (
            auctionDetails?.bids.map((bid, i) => {
                let headingStyle = i === 0 ? { color: 'green' } : { color: 'red' }
                return (
                    <Link href={`/player/${bid.bidder.uuid}`} key={'bid-' + i}>
                        <a className="disableLinkStyle">
                            <ListGroup.Item key={bid.amount} action>
                                <img
                                    crossOrigin="anonymous"
                                    className="playerHeadIcon"
                                    src={bid.bidder.iconUrl}
                                    height="64"
                                    alt="bidder minecraft icon"
                                    style={{ marginRight: '15px', float: 'left' }}
                                    loading="lazy"
                                />
                                <h6 style={headingStyle}>{numberWithThousandsSeparators(bid.amount)} Coins</h6>
                                <span>{bid.bidder.name}</span>
                                <br />
                                <span>{moment(bid.timestamp).fromNow()}</span>
                            </ListGroup.Item>
                        </a>
                    </Link>
                )
            })
        )

    return (
        <div className={styles.auctionDetails}>
            {isLoading ? (
                getLoadingElement()
            ) : isNoAuctionFound ? (
                <div>
                    <p>The auction you tried to see doesn't seem to exist. Please go back.</p>
                    <br />
                    <Link href="/">
                        <a className="disableLinkStyle">
                            <Button>Get back</Button>
                        </a>
                    </Link>
                </div>
            ) : (
                <div>
                    <div>
                        <Card className={`${styles.auctionCard} ${styles.firstCard}`}>{auctionCardContent}</Card>
                        <Card className={styles.auctionCard}>
                            <Card.Header>
                                <h2>Bids</h2>
                                {auctionDetails ? <h6>Starting bid: {numberWithThousandsSeparators(auctionDetails?.auction.startingBid)} Coins</h6> : ''}
                            </Card.Header>
                            <Card.Body>
                                <ListGroup>{bidList || getLoadingElement()}</ListGroup>
                            </Card.Body>
                        </Card>
                    </div>
                </div>
            )}
            {basedOnDialog}
        </div>
    )
}

export default AuctionDetails
