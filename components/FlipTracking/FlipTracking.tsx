import React, { ChangeEvent, useEffect, useState } from 'react'
import { Badge, Card, Form, ListGroup, Table } from 'react-bootstrap'
import { ArrowRightAlt as ArrowRightIcon, ArrowDownward as ArrowDownIcon } from '@mui/icons-material'
import { getStyleForTier, numberWithThousandsSeperators } from '../../utils/Formatter'
import styles from './FlipTracking.module.css'
import { useRouter } from 'next/router'
import { CopyButton } from '../CopyButton/CopyButton'
import { isClientSideRendering } from '../../utils/SSRUtils'
import Tooltip from '../Tooltip/Tooltip'
import moment from 'moment'

interface Props {
    totalProfit?: number
    trackedFlips?: FlipTrackingFlip[]
    highlightedFlipUid?: string
}

interface SortOption {
    label: string
    value: string
    sortFunction(flips: FlipTrackingFlip[])
}

const SORT_OPTIONS: SortOption[] = [
    {
        label: 'Time',
        value: 'timeAsc',
        sortFunction: flips => flips.sort((a, b) => b.sellTime.getTime() - a.sellTime.getTime())
    },
    {
        label: 'Profit',
        value: 'profit',
        sortFunction: flips => flips.sort((a, b) => b.profit - a.profit)
    },
    {
        label: 'Sell price',
        value: 'sellPrice',
        sortFunction: flips => flips.sort((a, b) => b.soldFor - a.soldFor)
    }
]

export function FlipTracking(props: Props) {
    let [totalProfit, setTotalProfit] = useState(props.totalProfit || 0)
    let [trackedFlips, setTrackedFlips] = useState<FlipTrackingFlip[]>(props.trackedFlips || [])
    let [orderBy, setOrderBy] = useState<SortOption>(SORT_OPTIONS[0])
    let router = useRouter()

    useEffect(() => {
        if (props.highlightedFlipUid && isClientSideRendering()) {
            let element = document.getElementById(props.highlightedFlipUid) as HTMLElement
            window.scrollTo({
                top: element.offsetTop
            })
        }
    }, [])

    function updateOrderBy(event: ChangeEvent<HTMLSelectElement>) {
        let selectedIndex = event.target.options.selectedIndex
        let value = event.target.options[selectedIndex].getAttribute('value')!
        let sortOption = SORT_OPTIONS.find(option => option.value === value)
        if (sortOption) {
            setOrderBy(sortOption)
        }
    }

    let orderedFlips = trackedFlips
    if (orderBy) {
        let sortOption = SORT_OPTIONS.find(option => option.value === orderBy.value)
        orderedFlips = sortOption?.sortFunction(trackedFlips)
    }

    let list = orderedFlips.map((trackedFlip, i) => {
        return (
            <ListGroup.Item
                className={styles.listGroupItem}
                id={trackedFlip.uId.toString(16)}
                style={{
                    borderColor: props.highlightedFlipUid === trackedFlip.uId.toString(16) ? 'cornflowerblue' : undefined,
                    borderWidth: props.highlightedFlipUid === trackedFlip.uId.toString(16) ? 5 : undefined
                }}
            >
                <h1 style={{ padding: '10px', display: 'flex', justifyContent: 'space-between', fontSize: 'x-large' }}>
                    <div
                        className="ellipse"
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                            router.push(`/item/${trackedFlip.item.tag}`)
                        }}
                    >
                        <img
                            crossOrigin="anonymous"
                            src={trackedFlip.item.iconUrl}
                            height="36"
                            width="36"
                            alt=""
                            style={{ marginRight: '5px' }}
                            loading="lazy"
                        />
                        <span style={{ ...getStyleForTier(trackedFlip.item.tier), whiteSpace: 'nowrap' }}>{trackedFlip.item.name}</span>
                    </div>
                    {trackedFlip.profit > 0 ? (
                        <span style={{ color: 'lime', whiteSpace: 'nowrap', marginLeft: '5px' }}>
                            +{numberWithThousandsSeperators(trackedFlip.profit)} Coins
                        </span>
                    ) : (
                        <span style={{ color: 'red', whiteSpace: 'nowrap', marginLeft: '5px' }}>{numberWithThousandsSeperators(trackedFlip.profit)} Coins</span>
                    )}
                </h1>
                <hr />
                <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                    <Card className={styles.profitNumberCard}>
                        <a href={`/auction/${trackedFlip.originAuction}`} target={'_blank'} className="disableLinkStyle">
                            <Card.Header className={styles.profitNumberHeader}>
                                <Card.Title style={{ margin: 0 }}>{numberWithThousandsSeperators(trackedFlip.pricePaid)} Coins</Card.Title>
                            </Card.Header>
                        </a>
                    </Card>
                    <ArrowRightIcon style={{ fontSize: '50px' }} />
                    <Card className={styles.profitNumberCard}>
                        <a href={`/auction/${trackedFlip.soldAuction}`} target={'_blank'} className="disableLinkStyle">
                            <Card.Header className={styles.profitNumberHeader}>
                                <Card.Title style={{ margin: 0 }}>{numberWithThousandsSeperators(trackedFlip.soldFor)} Coins</Card.Title>
                            </Card.Header>
                        </a>
                    </Card>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                        <p style={{ marginTop: '10px' }}>
                            <Tooltip
                                content={
                                    <span>
                                        Finder: <Badge variant="dark">{trackedFlip.finder.shortLabel}</Badge>
                                    </span>
                                }
                                tooltipContent={
                                    <span>
                                        This is the first flip finder algorithm that reported this flip. Its possible that you used another one or even found
                                        this flip on your own
                                    </span>
                                }
                                type={'hover'}
                            />
                            <span style={{ marginLeft: '15px' }}>
                                <Tooltip
                                    type="hover"
                                    content={
                                        <span>
                                            <span className={styles.label}></span> {moment(trackedFlip.sellTime).fromNow()}
                                        </span>
                                    }
                                    tooltipContent={<span>{trackedFlip.sellTime.toLocaleDateString() + ' ' + trackedFlip.sellTime.toLocaleTimeString()}</span>}
                                />
                            </span>
                        </p>
                        <p
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                                let flips = [...trackedFlips]
                                trackedFlip.showPropertyChanges = !trackedFlip.showPropertyChanges
                                setTrackedFlips(flips)
                            }}
                        >
                            Profit changes: {trackedFlip.showPropertyChanges ? <ArrowDownIcon /> : <ArrowRightIcon />}
                        </p>
                        {trackedFlip.showPropertyChanges ? (
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Table>
                                    <tbody>
                                        {trackedFlip.propertyChanges.map(change => (
                                            <tr>
                                                <td>{change.description}</td>
                                                <td>
                                                    {' '}
                                                    {change.effect > 0 ? (
                                                        <span style={{ color: 'lime', whiteSpace: 'nowrap', marginLeft: '5px' }}>
                                                            +{numberWithThousandsSeperators(change.effect)} Coins
                                                        </span>
                                                    ) : (
                                                        <span style={{ color: 'red', whiteSpace: 'nowrap', marginLeft: '5px' }}>
                                                            {numberWithThousandsSeperators(change.effect)} Coins
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        ) : null}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'end' }}>
                        <CopyButton
                            copyValue={
                                isClientSideRendering() ? `${window.location.origin}/player/${router.query.uuid}/flips/${trackedFlip.uId.toString(16)}` : ''
                            }
                            successMessage={isClientSideRendering() ? <span>{`Copied link to flip!`}</span> : <span />}
                        />
                    </div>
                </div>
            </ListGroup.Item>
        )
    })

    return (
        <div>
            <b>
                <p style={{ fontSize: 'x-large' }}>
                    Total Profit: <span style={{ color: 'gold' }}>{numberWithThousandsSeperators(totalProfit)} Coins </span>
                    <span style={{ float: 'right', fontSize: 'small' }}>Only auctions sold in the last 7 days are displayed here.</span>
                    <Form.Control style={{ width: 'auto', marginTop: '20px' }} defaultValue={orderBy.value} as="select" onChange={updateOrderBy}>
                        {SORT_OPTIONS.map(option => (
                            <option value={option.value}>{option.label}</option>
                        ))}
                    </Form.Control>
                </p>
            </b>
            {trackedFlips.length === 0 ? (
                <div className={styles.noAuctionFound}>
                    <img src="/Barrier.png" width="24" height="24" alt="not found icon" style={{ float: 'left', marginRight: '5px' }} />{' '}
                    <p>We couldn't find any flips.</p>
                </div>
            ) : (
                <ListGroup className={styles.list}>{list}</ListGroup>
            )}
        </div>
    )
}
