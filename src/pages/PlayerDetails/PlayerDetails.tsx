import React, { useEffect, useState } from 'react';
import Search from '../../components/Search/Search';
import './PlayerDetails.css';
import { useParams } from 'react-router-dom';
import AuctionList from '../../components/AuctionList/AuctionList';
import { ToggleButton, ToggleButtonGroup } from 'react-bootstrap';
import BidList from '../../components/BidList/BidList';
import api from '../../api/ApiHelper';
import { parsePlayer } from '../../utils/Parser/APIResponseParser';

enum DetailType {
    AUCTIONS = "auctions",
    BIDS = "bids"
}

// save Detailtype for after navigation
let prevDetailType: DetailType;

function PlayerDetails() {

    let { uuid } = useParams();
    let [detailType, setDetailType_] = useState<DetailType>(prevDetailType || DetailType.AUCTIONS);
    let [selectedPlayer, setSelectedPlayer] = useState<Player>();

    useEffect(() => {
        api.getPlayerName(uuid).then(name => {
            setSelectedPlayer(parsePlayer({
                uuid: uuid,
                name: name
            }));
        })
    }, [uuid]);

    let onDetailTypeChange = (newType: DetailType) => {
        setDetailType(newType);
    }

    let getButtonVariant = (type: DetailType): string => {
        return type === detailType ? "primary" : "light";
    }

    let setDetailType = (type: DetailType) => {
        prevDetailType = type;
        setDetailType_(type);
    }

    return (
        <div className="player-details">
            <Search selected={selectedPlayer} />
            <ToggleButtonGroup className="player-details-type" type="radio" name="options" value={detailType} onChange={onDetailTypeChange}>
                <ToggleButton value={DetailType.AUCTIONS} variant={getButtonVariant(DetailType.AUCTIONS)} size="lg">Auctions</ToggleButton>
                <ToggleButton value={DetailType.BIDS} variant={getButtonVariant(DetailType.BIDS)} size="lg">Bids</ToggleButton>
            </ToggleButtonGroup>
            {detailType === DetailType.AUCTIONS ? <AuctionList playerUUID={uuid} /> : undefined}
            {detailType === DetailType.BIDS ? <BidList playerUUID={uuid} /> : undefined}
        </div >
    );
}

export default PlayerDetails;
