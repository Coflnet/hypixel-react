import React from 'react';
import { Badge, Card } from 'react-bootstrap';
import { getStyleForTier, numberWithThousandsSeperators } from '../../../utils/Formatter';
import { Help as HelpIcon } from '@material-ui/icons';
import { CopyButton } from '../../CopyButton/CopyButton';

interface Props {
    flip: FlipAuction,
    style?: any,
    onBasedAuctionClick?(flip: FlipAuction),
    onCardClick?(flip: FlipAuction),
    onCopy?(flip: FlipAuction)
}

function Flip(props: Props) {

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

    return (
        <div className="flip" key={props.flip.uuid} style={props.style}>
            <Card className="flip-auction-card" style={{ cursor: "pointer" }} onClick={onCardClick}>
                <Card.Header style={{ padding: "10px" }}>
                    <div className="ellipse" style={{ width: props.flip.bin && props.flip.sold ? "60%" : "80%", float: "left" }}>
                        <img crossOrigin="anonymous" src={props.flip.item.iconUrl} height="24" width="24" alt="" style={{ marginRight: "5px" }} loading="lazy" />
                        <span style={getStyleForTier(props.flip.item.tier)}>{props.flip.item.name}</span>
                    </div>
                    {props.flip.bin ? <Badge style={{ marginLeft: "5px" }} variant="success">BIN</Badge> : ""}
                    {props.flip.sold ? <Badge style={{ marginLeft: "5px" }} variant="danger">SOLD</Badge> : ""}
                </Card.Header>
                <Card.Body style={{ padding: "10px" }}>
                    <p>
                        <span className="card-label">Cost: </span><br />
                        <b style={{ color: "red" }}>{numberWithThousandsSeperators(props.flip.cost)} Coins</b>
                    </p>
                    <p>
                        <span className="card-label">Median price: </span><br />
                        <b>{numberWithThousandsSeperators(props.flip.median)} Coins</b>
                    </p>
                    <p>
                        <span className="card-label">Estimated Profit: </span><br />
                        <b style={{ color: "lime" }}>
                            +{numberWithThousandsSeperators(props.flip.median - props.flip.cost)} Coins
                        </b>
                        <span style={{ float: "right" }}>
                            <span onClick={onBasedAuctionClick}><HelpIcon /></span>
                        </span>
                    </p>
                    <hr />
                    <p>
                        <span className="card-label">Lowest BIN: </span><br />
                        <a rel="noreferrer" target="_blank" href={getLowestBinLink(props.flip.item.tag)}>
                            {numberWithThousandsSeperators(props.flip.lowestBin)} Coins
                        </a>
                    </p>
                    <p>
                        <span className="card-label">Seller: </span><br />
                        <b>
                            {props.flip.sellerName}
                        </b>
                    </p>
                    <hr />
                    <div className="flex">
                        <div className="flex-max">
                            <span className="card-label">Volume: </span>
                            {props.flip.volume > 59 ? ">60" : "~" + Math.round(props.flip.volume * 10) / 10} per day
                        </div>
                        <CopyButton forceIsCopied={props.flip.isCopied} onCopy={onCopy} buttonWrapperClass="flip-auction-copy-button" successMessage={<p>Copied ingame link <br /><i>/viewauction {props.flip.uuid}</i></p>} copyValue={"/viewauction " + props.flip.uuid} />
                    </div>
                </Card.Body>
            </Card>
        </div >
    );
}

export default Flip;