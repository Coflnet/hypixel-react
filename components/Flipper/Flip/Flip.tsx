import { useMatomo } from '@jonkoops/matomo-tracker-react'
import HelpIcon from '@mui/icons-material/Help'
import Image from 'next/image'
import { useEffect } from 'react'
import { Badge, Card } from 'react-bootstrap'
import { toast } from 'react-toastify'
import { CUSTOM_EVENTS } from '../../../api/ApiTypes.d'
import { calculateProfit, getFlipCustomizeSettings, getFlipFinders } from '../../../utils/FlipUtils'
import { formatDungeonStarsInString, formatToPriceToShorten, getStyleForTier, numberWithThousandsSeparators } from '../../../utils/Formatter'
import { useForceUpdate } from '../../../utils/Hooks'
import { CopyButton } from '../../CopyButton/CopyButton'
import styles from './Flip.module.css'

interface Props {
    flip: FlipAuction
    style?: any
    onBasedAuctionClick?(flip: FlipAuction)
    onCardClick?(flip: FlipAuction)
    onCopy?(flip: FlipAuction)
}

function Flip(props: Props) {
    let settings = getFlipCustomizeSettings()
    let forceUpdate = useForceUpdate()
    let { trackEvent } = useMatomo()

    useEffect(() => {
        document.addEventListener(CUSTOM_EVENTS.FLIP_SETTINGS_CHANGE, forceUpdate)

        return () => {
            document.removeEventListener(CUSTOM_EVENTS.FLIP_SETTINGS_CHANGE, forceUpdate)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    function getLowestBinLink(itemTag: string) {
        return '/item/' + itemTag + '?range=active&itemFilter=eyJCaW4iOiJ0cnVlIn0%3D'
    }

    function onCardClick() {
        if (props.onCardClick) {
            props.onCardClick(props.flip)
        }
    }

    function onBasedAuctionClick(e) {
        e.preventDefault()
        if (props.onBasedAuctionClick) {
            props.onBasedAuctionClick(props.flip)
        }
    }

    function onCopy(e) {
        if (e.defaultPrevented) {
            return
        }

        window.navigator.clipboard.writeText('/viewauction ' + props.flip.uuid)
        if (props.onCopy) {
            props.onCopy(props.flip)
        }
        if (!settings.hideCopySuccessMessage) {
            toast.success(
                <p>
                    Copied ingame link <br />
                    <i>/viewauction {props.flip.uuid}</i>
                </p>,
                {
                    autoClose: 1500,
                    pauseOnFocusLoss: false
                }
            )
        }
        trackEvent({
            category: 'copyButtonClick',
            action: '/viewauction ' + props.flip.uuid
        })
    }

    function getProfitElement(flip: FlipAuction): JSX.Element {
        let settings = getFlipCustomizeSettings()
        let profit = calculateProfit(flip, settings)
        let preSymbol = profit > 0 ? '+' : ''
        let profitPercentElement = <span>({Math.round((profit / flip.cost) * 100)}%)</span>
        return (
            <b style={{ color: profit > 0 ? 'lime' : 'white' }}>
                {preSymbol + formatPrices(profit) + ' Coins '}
                {!settings.hideProfitPercent ? profitPercentElement : null}
            </b>
        )
    }

    function onMouseDownLowestBin(e) {
        e.preventDefault()
        window.open(getLowestBinLink(props.flip.item.tag), '_blank')
    }

    function onMouseDownSeller(e) {
        e.preventDefault()
        window.open('/player/' + props.flip.sellerName)
    }

    function formatPrices(price: number) {
        if (settings.shortNumbers) {
            return formatToPriceToShorten(price)
        }
        return numberWithThousandsSeparators(price)
    }

    let stars = props.flip.item.name?.match(/✪+/gm)
    let itemName = stars && props.flip.item.name ? props.flip.item.name.split(stars[0])[0] : props.flip.item.name

    return (
        <div key={props.flip.uuid} style={props.style}>
            <Card className={styles.flipAuctionCard} style={{ cursor: 'pointer' }} onMouseDown={onCardClick}>
                <Card.Header style={{ padding: '10px', display: 'flex', justifyContent: 'space-between' }}>
                    <div className="ellipse">
                        <Image crossOrigin="anonymous" src={props.flip.item.iconUrl} height="24" alt="" style={{ marginRight: '5px' }} loading="lazy" />
                        <span style={getStyleForTier(props.flip.item.tier)}>{itemName}</span>
                    </div>
                    {stars ? formatDungeonStarsInString(stars[0]) : null}
                    {props.flip.bin ? (
                        <Badge style={{ marginLeft: '5px' }} variant="success">
                            BIN
                        </Badge>
                    ) : (
                        ''
                    )}
                    {props.flip.sold ? (
                        <Badge style={{ marginLeft: '5px' }} variant="danger">
                            SOLD
                        </Badge>
                    ) : (
                        ''
                    )}
                </Card.Header>
                <Card.Body style={{ padding: '10px', cursor: 'pointer' }} onMouseDown={onCopy}>
                    {settings.hideCost ? null : (
                        <p>
                            <span>Cost: </span>
                            <br />
                            <b style={{ color: 'red' }}>{formatPrices(props.flip.cost)} Coins</b>
                        </p>
                    )}
                    {settings.hideMedianPrice ? null : (
                        <p>
                            <span>Target price: </span>
                            <br />
                            <b>{formatPrices(props.flip.median)} Coins</b>
                        </p>
                    )}
                    {settings.hideEstimatedProfit ? null : (
                        <p>
                            <span>Estimated Profit: </span>
                            <br />
                            {getProfitElement(props.flip)}
                            <span style={{ float: 'right' }}>
                                <span onMouseDown={onBasedAuctionClick}>
                                    <HelpIcon />
                                </span>
                            </span>
                        </p>
                    )}
                    {settings.hideLowestBin && settings.hideSeller && settings.hideSecondLowestBin ? null : <hr />}
                    {settings.hideLowestBin ? null : (
                        <p>
                            <span>Lowest BIN: </span>
                            <br />
                            {!settings.disableLinks ? (
                                <a rel="noreferrer" target="_blank" onMouseDown={onMouseDownLowestBin} href={getLowestBinLink(props.flip.item.tag)}>
                                    {formatPrices(props.flip.lowestBin)} Coins
                                </a>
                            ) : (
                                <span>{formatPrices(props.flip.lowestBin)} Coins</span>
                            )}
                        </p>
                    )}
                    {settings.hideSecondLowestBin ? null : (
                        <p>
                            <span>Second lowest BIN: </span>
                            <br />
                            {!settings.disableLinks ? (
                                <a rel="noreferrer" target="_blank" onMouseDown={onMouseDownLowestBin} href={getLowestBinLink(props.flip.item.tag)}>
                                    {formatPrices(props.flip.secondLowestBin)} Coins
                                </a>
                            ) : (
                                <span>{formatPrices(props.flip.secondLowestBin)} Coins</span>
                            )}
                        </p>
                    )}
                    {settings.hideSeller ? null : (
                        <p>
                            <span>Seller: </span>
                            <br />
                            {!settings.disableLinks ? (
                                <a rel="noreferrer" target="_blank" onMouseDown={onMouseDownSeller} href={'/player/' + props.flip.sellerName}>
                                    <b>{props.flip.sellerName}</b>
                                </a>
                            ) : (
                                <span>
                                    <b>{props.flip.sellerName}</b>
                                </span>
                            )}
                        </p>
                    )}
                    {props.flip.props && props.flip.props?.length > 0 && settings.maxExtraInfoFields! > 0 ? (
                        <span>
                            <hr />
                            <ul>
                                {props.flip.props?.map((prop, i) => {
                                    if (i >= settings.maxExtraInfoFields!) {
                                        return ''
                                    } else {
                                        return <li key={i}>{prop}</li>
                                    }
                                })}
                            </ul>
                        </span>
                    ) : (
                        ''
                    )}
                    <hr />
                    <div className={styles.flex}>
                        {settings.hideVolume ? null : (
                            <div className={styles.flexMax}>
                                <span>Volume: </span>
                                {props.flip.volume > 59 ? '>60' : '~' + Math.round(props.flip.volume * 10) / 10} per day
                            </div>
                        )}
                        {getFlipFinders([props.flip.finder]).map(finder => {
                            return (
                                <Badge key={finder.shortLabel} variant="dark">
                                    {finder.shortLabel}
                                </Badge>
                            )
                        })}
                    </div>
                    <CopyButton forceIsCopied={props.flip.isCopied} buttonClass={styles.flipAuctionCopyButton} />
                </Card.Body>
            </Card>
        </div>
    )
}

export default Flip
