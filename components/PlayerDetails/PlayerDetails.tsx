'use client'
import Image from 'next/image'
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn'
import Search from '../Search/Search'
import Link from 'next/link'
import { Button, ToggleButton, ToggleButtonGroup } from 'react-bootstrap'
import PlayerDetailsList from '../PlayerDetailsList/PlayerDetailsList'
import { useEffect, useState } from 'react'
import { useSwipe } from '../../utils/Hooks'
import api from '../../api/ApiHelper'
import styles from './index.module.css'
import ClaimAccount from '../ClaimAccount/ClaimAccount'
import Tooltip from '../Tooltip/Tooltip'

enum DetailType {
    AUCTIONS = 'auctions',
    BIDS = 'bids'
}

// save Detailtype for after navigation
let prevDetailType: DetailType

interface Props {
    player: Player
    auctions: Auction[]
}

export default function PlayerDetails(props: Props) {
    let [detailType, setDetailType_] = useState<DetailType>(prevDetailType || DetailType.AUCTIONS)
    let [accountInfo, setAccountInfo] = useState<AccountInfo>()
    let removeSwipeListeners = useSwipe(undefined, onSwipeRight, undefined, onSwipeLeft)

    useEffect(() => {
        return () => {
            removeSwipeListeners!()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

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
        return type === detailType ? 'primary' : 'secondary'
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

    let claimAccountElement =
        props.player.uuid !== accountInfo?.mcId ? (
            <span style={{ marginLeft: '25px' }}>
                <Tooltip
                    type="click"
                    content={<span style={{ color: '#007bff', cursor: 'pointer' }}>You? Claim account.</span>}
                    tooltipContent={<ClaimAccount playerUUID={props.player.uuid} />}
                    size="xl"
                    tooltipTitle={<span>Claim Minecraft account</span>}
                />
            </span>
        ) : (
            <span style={{ marginLeft: '25px', color: '#007bff' }}>(Your Account)</span>
        )

    return (
        <>
            <div style={{ visibility: 'collapse', height: 0 }}>
                <GoogleSignIn onAfterLogin={onAfterLogin} />
            </div>
            <Search
                selected={props.player}
                type="player"
                currentElement={
                    <span>
                        <Image
                            crossOrigin="anonymous"
                            className="playerHeadIcon"
                            src={props.player.iconUrl || ''}
                            height="32"
                            width="32"
                            alt=""
                            style={{ marginRight: '10px' }}
                        />
                        <span>{props.player.name}</span>
                        {claimAccountElement}
                        <Link href={`/player/${props.player.uuid}/flips`}>
                            <Button style={{ marginLeft: '15px' }} variant="info">
                                Check tracked flips
                            </Button>
                        </Link>
                    </span>
                }
            />
            <ToggleButtonGroup className={styles.playerDetailsType} type="radio" name="options" value={detailType} onChange={onDetailTypeChange}>
                <ToggleButton id="auctionToggleButton" value={DetailType.AUCTIONS} variant={getButtonVariant(DetailType.AUCTIONS)} size="lg">
                    Auctions
                </ToggleButton>
                <ToggleButton id="bidsToggleButton" value={DetailType.BIDS} variant={getButtonVariant(DetailType.BIDS)} size="lg">
                    Bids
                </ToggleButton>
            </ToggleButtonGroup>
            {detailType === DetailType.AUCTIONS ? (
                <PlayerDetailsList
                    key={'auctions'}
                    type="auctions"
                    accountInfo={accountInfo}
                    auctions={props.auctions}
                    loadingDataFunction={api.getAuctions}
                    player={props.player}
                    onAfterLogin={onAfterLogin}
                />
            ) : undefined}
            {detailType === DetailType.BIDS ? (
                <PlayerDetailsList
                    key={'bids'}
                    type="bids"
                    loadingDataFunction={api.getBids}
                    player={props.player}
                    accountInfo={accountInfo}
                    onAfterLogin={onAfterLogin}
                />
            ) : undefined}
        </>
    )
}
