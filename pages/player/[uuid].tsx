import React, { useEffect, useState } from 'react'
import Search from '../../components/Search/Search'
import { Container, ToggleButton, ToggleButtonGroup } from 'react-bootstrap'
import api, { initAPI } from '../../api/ApiHelper'
import { parseAuction, parsePlayer } from '../../utils/Parser/APIResponseParser'
import { useSwipe } from '../../utils/Hooks'
import Tooltip from '../../components/Tooltip/Tooltip'
import ClaimAccount from '../../components/ClaimAccount/ClaimAccount'
import PlayerDetailsList from '../../components/PlayerDetailsList/PlayerDetailsList'
import { wasAlreadyLoggedIn } from '../../utils/GoogleUtils'
import GoogleSignIn from '../../components/GoogleSignIn/GoogleSignIn'
import { useRouter } from 'next/router'
import { getHeadElement, isClientSideRendering } from '../../utils/SSRUtils'
import styles from './player.module.css'

enum DetailType {
    AUCTIONS = 'auctions',
    BIDS = 'bids'
}

// save Detailtype for after navigation
let prevDetailType: DetailType

interface Props {
    auctions?: any[]
}

function PlayerDetails(props: Props) {
    const router = useRouter()
    let uuid = router.query.uuid as string
    let [detailType, setDetailType_] = useState<DetailType>(prevDetailType || DetailType.AUCTIONS)
    let [selectedPlayer, setSelectedPlayer] = useState<Player>()
    let [accountInfo, setAccountInfo] = useState<AccountInfo>()
    let removeSwipeListeners = useSwipe(undefined, onSwipeRight, undefined, onSwipeLeft)

    useEffect(() => {
        return () => {
            removeSwipeListeners!()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (!isClientSideRendering()) {
            return
        }
        api.getPlayerName(uuid).then(name => {
            setSelectedPlayer(
                parsePlayer({
                    uuid: uuid,
                    name: name
                })
            )
        })
    }, [uuid])

    function onSwipeRight() {
        setDetailType(DetailType.AUCTIONS)
    }

    function onSwipeLeft() {
        setDetailType(DetailType.BIDS)
    }

    let onDetailTypeChange = (newType: DetailType) => {
        setDetailType(newType)
    }

    let getButtonVariant = (type: DetailType): string => {
        return type === detailType ? 'primary' : 'light'
    }

    let setDetailType = (type: DetailType) => {
        prevDetailType = type
        setDetailType_(type)
    }

    function onAfterLogin() {
        api.getAccountInfo().then(info => {
            setAccountInfo(info)
        })
    }

    let claimAccountElement = !wasAlreadyLoggedIn() ? null : uuid !== accountInfo?.mcId ? (
        <span style={{ marginLeft: '25px' }}>
            <Tooltip
                type="click"
                content={<span style={{ color: '#007bff', cursor: 'pointer' }}>You? Claim account.</span>}
                tooltipContent={<ClaimAccount playerUUID={uuid} />}
                size="xl"
                tooltipTitle={<span>Claim Minecraft account</span>}
            />
        </span>
    ) : (
        <span style={{ marginLeft: '25px', color: '#007bff' }}>(Your Account)</span>
    )

    return (
        <div className="page">
            {getHeadElement(
                `${selectedPlayer?.name} Auctions and Bids | Hypixel SkyBlock AH history tracker`,
                `Auctions and bids for ${selectedPlayer?.name} in Hypixel Skyblock.`,
                selectedPlayer?.iconUrl?.split('?')[0],
                [selectedPlayer?.name || ''],
                `${selectedPlayer?.name} Auctions and Bids | Hypixel SkyBlock AH history tracker`
            )}
            <Container>
                {wasAlreadyLoggedIn() ? (
                    <div style={{ visibility: 'collapse' }}>
                        <GoogleSignIn onAfterLogin={onAfterLogin} />
                    </div>
                ) : null}
                <Search
                    selected={selectedPlayer}
                    type="player"
                    currentElement={
                        <span>
                            <img
                                crossOrigin="anonymous"
                                className="playerHeadIcon"
                                src={selectedPlayer?.iconUrl}
                                height="32"
                                alt=""
                                style={{ marginRight: '10px' }}
                                loading="lazy"
                            />
                            <span>{selectedPlayer?.name}</span>
                            {claimAccountElement}
                        </span>
                    }
                />
                <ToggleButtonGroup className={styles.playerDetailsType} type="radio" name="options" value={detailType} onChange={onDetailTypeChange}>
                    <ToggleButton value={DetailType.AUCTIONS} variant={getButtonVariant(DetailType.AUCTIONS)} size="lg">
                        Auctions
                    </ToggleButton>
                    <ToggleButton value={DetailType.BIDS} variant={getButtonVariant(DetailType.BIDS)} size="lg">
                        Bids
                    </ToggleButton>
                </ToggleButtonGroup>
                {detailType === DetailType.AUCTIONS ? (
                    <PlayerDetailsList key={"auctions"} type="auctions" auctions={props.auctions?.map(parseAuction)} loadingDataFunction={api.getAuctions} playerUUID={uuid} />
                ) : undefined}
                {detailType === DetailType.BIDS ? <PlayerDetailsList key={"bids"} type="bids" loadingDataFunction={api.getBids} playerUUID={uuid} /> : undefined}
            </Container>
        </div>
    )
}

export const getServerSideProps = async ({ query }) => {
    let api = initAPI(true)
    let auctions = await api.getAuctions(query.uuid, 12, 0)
    return {
        props: {
            auctions: auctions
        }
    }
}

export default PlayerDetails
