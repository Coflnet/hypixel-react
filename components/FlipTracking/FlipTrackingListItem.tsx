'use client'
import { Badge, Button, Card, ListGroup, Table } from 'react-bootstrap'
import styles from './FlipTracking.module.css'
import { MouseEventHandler, Suspense, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { getMinecraftColorCodedElement, getStyleForTier } from '../../utils/Formatter'
import FlipTrackingCopyButton from './FlipTrackingCopyButton'
import { Number } from '../Number/Number'
import ArrowDownIcon from '@mui/icons-material/ArrowDownward'
import ArrowRightIcon from '@mui/icons-material/ArrowRightAlt'
import Tooltip from '../Tooltip/Tooltip'
import moment from 'moment'
import HelpIcon from '@mui/icons-material/Help'

interface Props {
    trackedFlip: FlipTrackingFlip
    isHighlighted: boolean
    onContextMenu: MouseEventHandler<HTMLElement> | undefined
    ignoreProfit: boolean
    onRemoveFlipFromIgnoreMap()
}

export function FlipTrackingListItem(props: Props) {
    let router = useRouter()
    let [showPropertyChanges, setShowPropertyChanges] = useState(false)

    return (
        <ListGroup.Item
            className={styles.listGroupItem}
            onContextMenu={props.onContextMenu}
            id={props.trackedFlip.uId.toString(16)}
            style={{
                borderColor: props.isHighlighted ? 'cornflowerblue' : undefined,
                borderWidth: props.isHighlighted ? 5 : undefined
            }}
        >
            <h1 style={{ padding: '10px', display: 'flex', justifyContent: 'space-between', fontSize: 'x-large' }}>
                <div
                    className="ellipse"
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                        router.push(`/item/${props.trackedFlip.item.tag}`)
                    }}
                >
                    <Image
                        crossOrigin="anonymous"
                        src={props.trackedFlip.item.iconUrl || ''}
                        height="36"
                        width="36"
                        alt=""
                        style={{ marginRight: '5px' }}
                        loading="lazy"
                    />
                    <span style={{ whiteSpace: 'nowrap', ...getStyleForTier(props.trackedFlip.item.tier) }}>
                        {getMinecraftColorCodedElement(props.trackedFlip.item.name)}
                    </span>
                </div>
                {props.trackedFlip.profit > 0 ? (
                    <span style={{ color: 'lime', whiteSpace: 'nowrap', marginLeft: '5px' }}>
                        +<Number number={props.trackedFlip.profit} /> Coins
                    </span>
                ) : (
                    <span style={{ color: 'red', whiteSpace: 'nowrap', marginLeft: '5px' }}>
                        <Number number={props.trackedFlip.profit} /> Coins
                    </span>
                )}
            </h1>
            <hr />
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                <Card className={styles.profitNumberCard}>
                    <a href={`/auction/${props.trackedFlip.originAuction}`} target={'_blank'} className="disableLinkStyle">
                        <Card.Header className={styles.profitNumberHeader}>
                            <Card.Title style={{ margin: 0 }}>
                                <Number number={props.trackedFlip.pricePaid} /> Coins
                            </Card.Title>
                        </Card.Header>
                    </a>
                </Card>
                <ArrowRightIcon style={{ fontSize: '50px' }} />
                <Card className={styles.profitNumberCard}>
                    <a href={`/auction/${props.trackedFlip.soldAuction}`} target={'_blank'} className="disableLinkStyle">
                        <Card.Header className={styles.profitNumberHeader}>
                            <Card.Title style={{ margin: 0 }}>
                                <Number number={props.trackedFlip.soldFor} /> Coins
                            </Card.Title>
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
                                    Finder: <Badge bg="dark">{props.trackedFlip.finder.shortLabel}</Badge>
                                </span>
                            }
                            tooltipContent={
                                <span>
                                    This is the first flip finder algorithm that reported this flip. Its possible that you used another one or even found this
                                    flip on your own
                                </span>
                            }
                            type={'hover'}
                        />
                        <span style={{ marginLeft: '15px' }}>
                            <Tooltip
                                type="hover"
                                content={
                                    <span>
                                        <span className={styles.label}></span>Sold {moment(props.trackedFlip.sellTime).fromNow()}
                                    </span>
                                }
                                tooltipContent={
                                    <span>{props.trackedFlip.sellTime.toLocaleDateString() + ' ' + props.trackedFlip.sellTime.toLocaleTimeString()}</span>
                                }
                            />
                        </span>
                    </p>
                    <p>Flags: {props.trackedFlip.flags}</p>
                    <p
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                            setShowPropertyChanges(!showPropertyChanges)
                        }}
                    >
                        Profit changes: {showPropertyChanges ? <ArrowDownIcon /> : <ArrowRightIcon />}
                    </p>
                    {showPropertyChanges ? (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Table>
                                <tbody>
                                    {props.trackedFlip.propertyChanges.map(change => (
                                        <tr>
                                            <td>{change.description}</td>
                                            <td>
                                                {' '}
                                                {change.effect > 0 ? (
                                                    <span style={{ color: 'lime', whiteSpace: 'nowrap', marginLeft: '5px' }}>
                                                        +<Number number={change.effect} /> Coins
                                                    </span>
                                                ) : (
                                                    <span style={{ color: 'red', whiteSpace: 'nowrap', marginLeft: '5px' }}>
                                                        <Number number={change.effect} />
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
                    <Suspense>
                        <div>
                            <Tooltip
                                type="hover"
                                content={<HelpIcon style={{ color: '#007bff', cursor: 'pointer', marginRight: 5 }} />}
                                tooltipContent={<p>Flags: {props.trackedFlip.flags}</p>}
                            />
                            <FlipTrackingCopyButton trackedFlip={props.trackedFlip} />
                        </div>
                    </Suspense>
                </div>
            </div>
            {props.ignoreProfit ? (
                <>
                    <hr />
                    <p style={{ color: 'yellow' }}>
                        <b>This flip is ignored from the profit calculation</b>
                        <Button
                            variant="info"
                            style={{ marginLeft: '10px' }}
                            onClick={() => {
                                props.onRemoveFlipFromIgnoreMap()
                            }}
                        >
                            Re-Add
                        </Button>
                    </p>
                </>
            ) : null}
        </ListGroup.Item>
    )
}
