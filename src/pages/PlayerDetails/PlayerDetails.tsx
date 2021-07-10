import React, { useEffect, useState } from 'react';
import Search from '../../components/Search/Search';
import './PlayerDetails.css';
import { useParams } from 'react-router-dom';
import AuctionList from '../../components/AuctionList/AuctionList';
import { Container, ToggleButton, ToggleButtonGroup } from 'react-bootstrap';
import BidList from '../../components/BidList/BidList';
import api from '../../api/ApiHelper';
import { parsePlayer } from '../../utils/Parser/APIResponseParser';
import { useSwipe } from '../../utils/Hooks';

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
    let removeSwipeListeners = useSwipe(undefined, onSwipeRight, undefined, onSwipeLeft);

    useEffect(() => {
        return () => {
            removeSwipeListeners();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        api.getPlayerName(uuid).then(name => {
            setSelectedPlayer(parsePlayer({
                uuid: uuid,
                name: name
            }));
            document.title = `Auctions and bids from ${name} in the hypixel skyblock ah`
        });
    }, [uuid]);

    function onSwipeRight() {
        setDetailType(DetailType.AUCTIONS);
    }

    function onSwipeLeft() {
        setDetailType(DetailType.BIDS);
    }

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
            <Container>
                <Search selected={selectedPlayer} />
                <ToggleButtonGroup className="player-details-type" type="radio" name="options" value={detailType} onChange={onDetailTypeChange}>
                    <ToggleButton value={DetailType.AUCTIONS} variant={getButtonVariant(DetailType.AUCTIONS)} size="lg">Auctions</ToggleButton>
                    <ToggleButton value={DetailType.BIDS} variant={getButtonVariant(DetailType.BIDS)} size="lg">Bids</ToggleButton>
                </ToggleButtonGroup>
                {detailType === DetailType.AUCTIONS ? <AuctionList playerUUID={uuid} /> : undefined}
                {detailType === DetailType.BIDS ? <BidList playerUUID={uuid} /> : undefined}
            </Container>
        </div >
    );
}

export default PlayerDetails;
