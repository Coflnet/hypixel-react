import React, { useEffect, useState } from 'react'
import Search from '../../../components/Search/Search'
import { Button, Container, ToggleButton, ToggleButtonGroup } from 'react-bootstrap'
import api, { initAPI } from '../../../api/ApiHelper'
import { parseAuction, parsePlayer } from '../../../utils/Parser/APIResponseParser'
import { useSwipe, useWasAlreadyLoggedIn } from '../../../utils/Hooks'
import Tooltip from '../../../components/Tooltip/Tooltip'
import ClaimAccount from '../../../components/ClaimAccount/ClaimAccount'
import PlayerDetailsList from '../../../components/PlayerDetailsList/PlayerDetailsList'
import GoogleSignIn from '../../../components/GoogleSignIn/GoogleSignIn'
import { useRouter } from 'next/router'
import { getHeadElement, isClientSideRendering } from '../../../utils/SSRUtils'
import styles from './index.module.css'
import Link from 'next/link'
import Hyauctions from '../../../components/Hyauctions/Hyauctions'
import { getCacheContolHeader } from '../../../utils/CacheUtils'
import TEMItems from '../../../components/TEMItems/TEMItems'

enum DetailType {
    AUCTIONS = 'auctions',
    BIDS = 'bids',
    ITEMS = 'items'
}

// save Detailtype for after navigation
let prevDetailType: DetailType

interface Props {
    auctions?: any[]
    player?: any
}

function PlayerDetails(props: Props) {
    const router = useRouter()
    let uuid = router.query.uuid as string
    let [detailType, setDetailType_] = useState<DetailType>(prevDetailType || DetailType.AUCTIONS)
    let [selectedPlayer, setSelectedPlayer] = useState<Player>(parsePlayer(props.player))
    let [accountInfo, setAccountInfo] = useState<AccountInfo>()
    let [isLoggedIn, setIsLoggedIn] = useState(false)
    let wasAlreadyLoggedIn = useWasAlreadyLoggedIn()
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
        setIsLoggedIn(true)
        api.getAccountInfo().then(info => {
            setAccountInfo(info)
        })
    }

    let claimAccountElement =
        uuid !== accountInfo?.mcId ? (
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

    // special case for people searching hyauctions
    // window.document.referrer.includes('google')
    if (uuid === 'be7002531956406d81c535a81fe2833a') {
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
                    <Search />
                    <Hyauctions />
                </Container>
            </div>
        )
    }

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
                {wasAlreadyLoggedIn ? (
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
                            />
                            <span>{selectedPlayer?.name}</span>
                            {claimAccountElement}
                            <Link href={`/player/${uuid}/flips`}>
                                <Button style={{ marginLeft: '15px' }} variant="info">
                                    Check tracked flips
                                </Button>
                            </Link>
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
                    <ToggleButton value={DetailType.ITEMS} variant={getButtonVariant(DetailType.ITEMS)} size="lg">
                        Items
                    </ToggleButton>
                </ToggleButtonGroup>
                {detailType === DetailType.AUCTIONS ? (
                    <PlayerDetailsList
                        key={'auctions'}
                        type="auctions"
                        auctions={props.auctions?.map(parseAuction)}
                        loadingDataFunction={api.getAuctions}
                        player={selectedPlayer}
                    />
                ) : undefined}
                {detailType === DetailType.BIDS ? (
                    <PlayerDetailsList key={'bids'} type="bids" loadingDataFunction={api.getBids} player={selectedPlayer} />
                ) : undefined}
                {detailType === DetailType.ITEMS ? <TEMItems playerUUID={uuid} /> : null}
            </Container>
        </div>
    )
}

export const getServerSideProps = async ({ res, params }) => {
    res.setHeader('Cache-Control', getCacheContolHeader())

    let api = initAPI(true)
    let playerName = await api.getPlayerName(params.uuid)
    let auctions = await api.getAuctions(params.uuid, 12, 0)
    return {
        props: {
            auctions: auctions,
            player: {
                uuid: params.uuid,
                name: playerName
            }
        }
    }
}

export default PlayerDetails
