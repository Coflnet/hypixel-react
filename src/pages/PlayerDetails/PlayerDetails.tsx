import React, { useEffect, useState } from 'react';
import Search from '../../components/Search/Search';
import './PlayerDetails.css';
import { useParams } from 'react-router-dom';
import { Container, ToggleButton, ToggleButtonGroup } from 'react-bootstrap';
import api from '../../api/ApiHelper';
import { parsePlayer } from '../../utils/Parser/APIResponseParser';
import { useSwipe } from '../../utils/Hooks';
import Tooltip from '../../components/Tooltip/Tooltip';
import ClaimAccount from './ClaimAccount/ClaimAccount';
import PlayerDetailsList from '../../components/PlayerDetailsList/PlayerDetailsList';
import { wasAlreadyLoggedIn } from '../../utils/GoogleUtils';

enum DetailType {
    AUCTIONS = "auctions",
    BIDS = "bids"
}

// save Detailtype for after navigation
let prevDetailType: DetailType;

let wasAlreadyLoggedInGoogle = wasAlreadyLoggedIn();

function PlayerDetails() {

    let { uuid } = useParams();
    let [detailType, setDetailType_] = useState<DetailType>(prevDetailType || DetailType.AUCTIONS);
    let [selectedPlayer, setSelectedPlayer] = useState<Player>();
    let [accountInfo, setAccountInfo] = useState<AccountInfo>();
    let removeSwipeListeners = useSwipe(undefined, onSwipeRight, undefined, onSwipeLeft);

    useEffect(() => {

        let googleId = localStorage.getItem("googleId");
        if (wasAlreadyLoggedInGoogle && googleId) {
            api.setGoogle(googleId).then(() => {
                api.getAccountInfo().then(info => {
                    setAccountInfo(info);
                })
            })
        }

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
                <Search selected={selectedPlayer}
                    currentElement={
                        <h1 className="current">
                            <img crossOrigin="anonymous" className="player-head-icon" src={selectedPlayer?.iconUrl} width="32" height="32" alt="" style={{ marginRight: "10px" }} loading="lazy" />
                            <span>{selectedPlayer?.name}</span>
                            {
                                selectedPlayer?.name !== accountInfo?.mcName ?
                                    <span style={{ marginLeft: "25px" }}><Tooltip type="click" content={<span style={{ color: "#007bff", cursor: "pointer" }}>You? Claim account.</span>} tooltipContent={<ClaimAccount playerUUID={uuid} />} size="xl" tooltipTitle={<span>Claim Minecraft account</span>} /></span> : null
                            }
                        </h1>
                    } />
                <ToggleButtonGroup className="player-details-type" type="radio" name="options" value={detailType} onChange={onDetailTypeChange}>
                    <ToggleButton value={DetailType.AUCTIONS} variant={getButtonVariant(DetailType.AUCTIONS)} size="lg">Auctions</ToggleButton>
                    <ToggleButton value={DetailType.BIDS} variant={getButtonVariant(DetailType.BIDS)} size="lg">Bids</ToggleButton>
                </ToggleButtonGroup>
                {detailType === DetailType.AUCTIONS ? <PlayerDetailsList type="auctions" loadingDataFunction={api.getAuctions} playerUUID={uuid} /> : undefined}
                {detailType === DetailType.BIDS ? <PlayerDetailsList type="bids" loadingDataFunction={api.getBids} playerUUID={uuid} /> : undefined}
            </Container>
        </div >
    );
}

export default PlayerDetails;
