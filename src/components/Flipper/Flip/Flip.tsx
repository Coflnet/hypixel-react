import React, { useEffect } from 'react';
import { Badge, Card } from 'react-bootstrap';
import { getStyleForTier, numberWithThousandsSeperators } from '../../../utils/Formatter';
import { Help as HelpIcon } from '@material-ui/icons';
import { CopyButton } from '../../CopyButton/CopyButton';
import './Flip.css';
import { useForceUpdate } from '../../../utils/Hooks';
import { calculateProfit, getFlipCustomizeSettings } from '../../../utils/FlipUtils';
import { toast } from 'react-toastify';
import { useMatomo } from '@datapunt/matomo-tracker-react';

interface Props {
    flip: FlipAuction,
    style?: any,
    onBasedAuctionClick?(flip: FlipAuction),
    onCardClick?(flip: FlipAuction),
    onCopy?(flip: FlipAuction)
}

function Flip(props: Props) {

    let settings = getFlipCustomizeSettings();
    let forceUpdate = useForceUpdate();
    let { trackEvent } = useMatomo();

    useEffect(() => {
        document.addEventListener('flipSettingsChange', forceUpdate);

        return () => {
            document.removeEventListener('flipSettingsChange', forceUpdate);
        }
    }, [])

    function getLowestBinLink(itemTag: string) {
        return '/item/' + itemTag + '?range=active&itemFilter=eyJCaW4iOiJ0cnVlIn0%3D';
    }

    function onCardClick() {
        if (props.onCardClick) {
            props.onCardClick(props.flip);
        }
    }

    function onBasedAuctionClick(e) {
        e.preventDefault();
        if (props.onBasedAuctionClick) {
            props.onBasedAuctionClick(props.flip);
        }
    }

    function onCopy(e) {

        if (e.defaultPrevented) {
            return;
        }

        window.navigator.clipboard.writeText("/viewauction " + props.flip.uuid);
        if (props.onCopy) {
            props.onCopy(props.flip);
        }
        if (!settings.hideCopySuccessMessage) {
            toast.success(<p>Copied ingame link <br /><i>/viewauction {props.flip.uuid}</i></p>, {
                autoClose: 1500,
                pauseOnFocusLoss: false
            })
        }
        trackEvent({
            category: 'copyButtonClick',
            action: "/viewauction " + props.flip.uuid
        })
    }

    function getProfitElement(flip): JSX.Element {
        let profit = calculateProfit(flip);
        let preSymbol = profit > 0 ? "+" : "";
        return <b style={{ color: profit > 0 ? "lime" : "white" }}>{preSymbol + numberWithThousandsSeperators(profit) + " Coins"}</b>;
    }

    function onMouseDownLowestBin(e) {
        e.preventDefault();
        window.open(getLowestBinLink(props.flip.item.tag), '_blank');
    }

    function onMouseDownSeller(e) {
        e.preventDefault();
        window.open("/player/" + props.flip.sellerName);
    }

    let stars = props.flip.item.name?.match(/✪+/gm);
    let itemName = stars && props.flip.item.name ? props.flip.item.name.split(stars[0])[0] : props.flip.item.name;

    return (
        <div className="flip" key={props.flip.uuid} style={props.style}>
            <Card className="flip-auction-card" style={{ cursor: "pointer" }} onMouseDown={onCardClick}>
                <Card.Header style={{ padding: "10px", display: "flex", justifyContent: "space-between" }}>
                    <div className="ellipse">
                        <img crossOrigin="anonymous" src={props.flip.item.iconUrl} height="24" width="24" alt="" style={{ marginRight: "5px" }} loading="lazy" />
                        <span style={getStyleForTier(props.flip.item.tier)}>{itemName}</span>
                    </div>
                    <span style={getStyleForTier(props.flip.item.tier)}>{stars ? stars[0] : ""}</span>
                    {props.flip.bin ? <Badge style={{ marginLeft: "5px" }} variant="success">BIN</Badge> : ""}
                    {props.flip.sold ? <Badge style={{ marginLeft: "5px" }} variant="danger">SOLD</Badge> : ""}
                </Card.Header>
                <Card.Body style={{ padding: "10px", cursor: "pointer" }} onMouseDown={onCopy}>
                    {
                        settings.hideCost ? null :
                            <p>
                                <span className="card-label">Cost: </span><br />
                                <b style={{ color: "red" }}>{numberWithThousandsSeperators(props.flip.cost)} Coins</b>
                            </p>
                    }
                    {
                        settings.hideMedianPrice ? null :
                            <p>
                                <span className="card-label">Median price: </span><br />
                                <b>{numberWithThousandsSeperators(props.flip.median)} Coins</b>
                            </p>
                    }
                    {
                        settings.hideEstimatedProfit ? null :
                            <p>
                                <span className="card-label">Estimated Profit: </span><br />
                                {getProfitElement(props.flip)}
                                <span style={{ float: "right" }}>
                                    <span onMouseDown={onBasedAuctionClick}><HelpIcon /></span>
                                </span>
                            </p>
                    }
                    {
                        settings.hideLowestBin && settings.hideSeller && settings.hideSecondLowestBin ? null : <hr />
                    }
                    {
                        settings.hideLowestBin ? null :
                            <p>
                                <span className="card-label">Lowest BIN: </span><br />
                                <a rel="noreferrer" target="_blank" onMouseDown={onMouseDownLowestBin} href={getLowestBinLink(props.flip.item.tag)}>
                                    {numberWithThousandsSeperators(props.flip.lowestBin)} Coins
                                </a>
                            </p>
                    }
                    {
                        settings.hideSecondLowestBin ? null :
                            <p>
                                <span className="card-label">Second lowest BIN: </span><br />
                                <a rel="noreferrer" target="_blank" onMouseDown={onMouseDownLowestBin} href={getLowestBinLink(props.flip.item.tag)}>
                                    {numberWithThousandsSeperators(props.flip.secondLowestBin)} Coins
                                </a>
                            </p>
                    }
                    {
                        settings.hideSeller ? null :
                            <p>
                                <span className="card-label">Seller: </span><br />
                                <a rel="noreferrer" target="_blank" onMouseDown={onMouseDownSeller} href={"/player/" + props.flip.sellerName}>
                                    <b>
                                        {props.flip.sellerName}
                                    </b>
                                </a>
                            </p>
                    }
                    {
                        props.flip.props && props.flip.props?.length > 0 && (settings.maxExtraInfoFields!) > 0 ?
                            <span>
                                <hr />
                                <ul>
                                    {
                                        props.flip.props?.map((prop, i) => {
                                            if (i >= settings.maxExtraInfoFields!) {
                                                return ""
                                            } else {
                                                return <li key={prop}>{prop}</li>
                                            }
                                        })

                                    }
                                </ul>
                            </span> : ""
                    }
                    {settings.hideVolume ? null : <hr />}
                    <div className="flex">
                        {
                            settings.hideVolume ? null :
                                <div className="flex-max">
                                    <span className="card-label">Volume: </span>
                                    {props.flip.volume > 59 ? ">60" : "~" + Math.round(props.flip.volume * 10) / 10} per day
                                </div>
                        }
                    </div>
                    <CopyButton forceIsCopied={props.flip.isCopied} buttonClass="flip-auction-copy-button" />
                </Card.Body>
            </Card>
        </div >
    );
}

export default Flip;