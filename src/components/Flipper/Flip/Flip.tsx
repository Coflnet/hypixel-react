import React, { useEffect } from 'react';
import { Badge, Card } from 'react-bootstrap';
import { getStyleForTier, numberWithThousandsSeperators } from '../../../utils/Formatter';
import { Help as HelpIcon } from '@material-ui/icons';
import { CopyButton } from '../../CopyButton/CopyButton';
import { FLIP_CUSTOMIZING_KEY, getSetting, setSetting } from '../../../utils/SettingsUtils';
import './Flip.css';
import { useForceUpdate } from '../../../utils/Hooks';

interface Props {
    flip: FlipAuction,
    style?: any,
    onBasedAuctionClick?(flip: FlipAuction),
    onCardClick?(flip: FlipAuction),
    onCopy?(flip: FlipAuction)
}

function Flip(props: Props) {

    let settings = getFlipCustomizingSettings();
    let forceUpdate = useForceUpdate();

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

    function onBasedAuctionClick() {
        if (props.onBasedAuctionClick) {
            props.onBasedAuctionClick(props.flip);
        }
    }

    function onCopy() {
        if (props.onCopy) {
            props.onCopy(props.flip);
        }
    }

    function getFlipCustomizingSettings(): FlipCustomizeSettings {
        let settings: FlipCustomizeSettings;
        try {
            settings = JSON.parse(getSetting(FLIP_CUSTOMIZING_KEY));
        } catch {
            settings = {
                hideCost: false,
                hideEstimatedProfit: false,
                hideLowestBin: false,
                hideMedianPrice: false,
                hideSeller: false,
                hideVolume: false,
                maxExtraInfoFields: 3
            };
            setSetting(FLIP_CUSTOMIZING_KEY, JSON.stringify(settings))
        }
        return settings;
    }

    let stars = props.flip.item.name?.match(/✪+/gm);
    let itemName = stars && props.flip.item.name ? props.flip.item.name.split(stars[0])[0] : props.flip.item.name;

    return (
        <div className="flip" key={props.flip.uuid} style={props.style}>
            <Card className="flip-auction-card" style={{ cursor: "pointer" }} onClick={onCardClick}>
                <Card.Header style={{ padding: "10px", display: "flex", justifyContent: "space-between" }}>
                    <div className="ellipse">
                        <img crossOrigin="anonymous" src={props.flip.item.iconUrl} height="24" width="24" alt="" style={{ marginRight: "5px" }} loading="lazy" />
                        <span style={getStyleForTier(props.flip.item.tier)}>{itemName}</span>
                    </div>
                    <span style={getStyleForTier(props.flip.item.tier)}>{stars ? stars[0] : ""}</span>
                    {props.flip.bin ? <Badge style={{ marginLeft: "5px" }} variant="success">BIN</Badge> : ""}
                    {props.flip.sold ? <Badge style={{ marginLeft: "5px" }} variant="danger">SOLD</Badge> : ""}
                </Card.Header>
                <Card.Body style={{ padding: "10px" }}>
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
                                <b style={{ color: "lime" }}>
                                    +{numberWithThousandsSeperators(props.flip.median - props.flip.cost)} Coins
                                </b>
                                <span style={{ float: "right" }}>
                                    <span onClick={onBasedAuctionClick}><HelpIcon /></span>
                                </span>
                            </p>
                    }
                    <hr />
                    {
                        settings.hideLowestBin ? null :
                            <p>
                                <span className="card-label">Lowest BIN: </span><br />
                                <a rel="noreferrer" target="_blank" href={getLowestBinLink(props.flip.item.tag)}>
                                    {numberWithThousandsSeperators(props.flip.lowestBin)} Coins
                                </a>
                            </p>
                    }
                    {
                        settings.hideSeller ? null :
                            <p>
                                <span className="card-label">Seller: </span><br />
                                <b>
                                    {props.flip.sellerName}
                                </b>
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
                    <hr />
                    <div className="flex">
                        {
                            settings.hideVolume ? null :
                                <div className="flex-max">
                                    <span className="card-label">Volume: </span>
                                    {props.flip.volume > 59 ? ">60" : "~" + Math.round(props.flip.volume * 10) / 10} per day
                                </div>
                        }
                        <CopyButton forceIsCopied={props.flip.isCopied} onCopy={onCopy} buttonWrapperClass="flip-auction-copy-button" successMessage={<p>Copied ingame link <br /><i>/viewauction {props.flip.uuid}</i></p>} copyValue={"/viewauction " + props.flip.uuid} />
                    </div>
                </Card.Body>
            </Card>
        </div >
    );
}

export default Flip;