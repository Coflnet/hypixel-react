import React, { useEffect, useState } from 'react'
import AuctionDetails from '../../components/AuctionDetails/AuctionDetails'
import { useForceUpdate } from '../../utils/Hooks'
import { Container } from 'react-bootstrap'
import Search from '../../components/Search/Search'
import { useRouter } from 'next/router'
import api, { initAPI } from '../../api/ApiHelper'
import '../../public/MinecraftColorCodes.3.7'
import { parseAuctionDetails, parseTEMItem } from '../../utils/Parser/APIResponseParser'
import { getHeadElement } from '../../utils/SSRUtils'
import { numberWithThousandsSeperators } from '../../utils/Formatter'
import moment from 'moment'
import { ConstructionOutlined, RttTwoTone } from '@mui/icons-material'
import { getCacheContolHeader } from '../../utils/CacheUtils'

interface Props {
    auctionDetails: any
    temItemDetails: any
}

function AuctionDetailsPage(props: Props) {
    const router = useRouter()
    let auctionUUID = router.query.auctionUUID as string
    let forceUpdate = useForceUpdate()
    let [auctionDetails, setAuctionDetails] = useState(props.auctionDetails ? parseAuctionDetails(props.auctionDetails) : undefined)
    let [temItemDetails, setTemItemDetails] = useState(props.temItemDetails ? parseTEMItem(props.temItemDetails) : undefined)

    useEffect(() => {
        window.scrollTo(0, 0)

        function reload() {
            if (auctionDetails && auctionDetails.auction.uuid !== auctionUUID) {
                window.location.reload()
            }
        }

        router.events.on('routeChangeComplete', reload)

        return () => {
            router.events.off('routeChangeComplete', reload)
        }
    }, [auctionUUID])

    useEffect(() => {
        forceUpdate()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [auctionDetails])

    function getAuctionDescription(): string {
        if (!auctionDetails) {
            return 'Browse over 400 million auctions, and the bazaar of Hypixel SkyBlock.'
        }

        let description = ''
        if (auctionDetails.auction.bin) {
            description += 'BIN '
        }
        description += `Auction for ${auctionDetails?.auction?.item?.name} by ${auctionDetails?.auctioneer?.name}`
        if (!auctionDetails.auction.bin) {
            description += `| Highest Bid: ${numberWithThousandsSeperators(auctionDetails.auction.highestBid)} Coins with ${auctionDetails.bids.length} Bids`
        } else if (auctionDetails.bids.length > 0) {
            description += `| Bought by ${auctionDetails.bids[0].bidder.name} for  ${numberWithThousandsSeperators(auctionDetails.auction.highestBid)} Coins`
        }

        if (auctionDetails.auction.end > new Date()) {
            description += ` | Ends on ${moment(auctionDetails.auction.end).format('MMMM Do YYYY, h:mm:ss a')}`
        } else {
            description += ` | Ended on ${moment(auctionDetails.auction.end).format('MMMM Do YYYY, h:mm:ss a')}`
        }

        return (description += ` | Category: ${auctionDetails.auction.item.category} | Rarity: ${auctionDetails.auction.item.tier}`)
    }

    return (
        <div className="page">
            {auctionDetails
                ? getHeadElement(
                      `Auction for ${auctionDetails?.auction?.item?.name} by ${auctionDetails?.auctioneer?.name} | Hypixel SkyBlock AH history tracker`,
                      getAuctionDescription(),
                      auctionDetails.auction.item.iconUrl,
                      [auctionDetails.auction.item.name || auctionDetails.auction.item.tag, auctionDetails.auctioneer.name],
                      `Auction for ${auctionDetails?.auction?.item?.name} by ${auctionDetails?.auctioneer?.name} | Hypixel SkyBlock AH history tracker`
                  )
                : getHeadElement()}
            <Container>
                <Search />
                <AuctionDetails auctionUUID={auctionUUID} auctionDetails={auctionDetails} temItemDetails={temItemDetails} />
            </Container>
        </div>
    )
}

export const getServerSideProps = async ({ res, params }) => {
    res.setHeader('Cache-Control', getCacheContolHeader())

    let auctionUUID = params.auctionUUID as string
    let api = initAPI(true)
    let auctionDetails: any
    let temDetails: TEM_Item | TEM_Pet
    try {
        auctionDetails = await api.getAuctionDetails(auctionUUID)
    } catch (e) {
        console.log('ERROR: ' + JSON.stringify(e))
        console.log('------------------------')
        return {
            props: {},
            revalidate: 60
        }
    }

    if (!auctionDetails) {
        console.log('auctionDetails not found (auctionUUID=' + auctionUUID + ')')
        console.log('------------------------')
        return {
            notFound: true
        }
    }

    auctionDetails.bids.sort((a, b) => b.amount - a.amount)

    let promises: Promise<void>[] = []
    try {
        if (auctionDetails.flatNbt.uid) {
            promises.push(
                api.getTEMItemData(auctionDetails.flatNbt.uid).then(details => {
                    temDetails = details
                })
            )
        }
    } catch {
        console.log('error fetching tem details for uId: ' + auctionDetails.flatNbt.uid)
        console.log('------------------------')
    }
    try {
        auctionDetails.iconUrl = api.getItemImageUrl(auctionDetails)
        if (!auctionDetails.name) {
            auctionDetails.name = auctionDetails.itemName
        }

        auctionDetails.bids.forEach(bid => {
            let promise = api
                .getPlayerName(bid.bidder)
                .then(name => {
                    let newBidder = {
                        name: name,
                        uuid: bid.bidder
                    }
                    bid.bidder = newBidder
                })
                .catch(() => {
                    let newBidder = {
                        name: '',
                        uuid: bid.bidder
                    }
                    bid.bidder = newBidder
                    console.log(`No username for player ${bid.bidder}`)
                    console.log('------------------------')
                })
            promises.push(promise)
        })
        promises.push(
            api
                .getPlayerName(auctionDetails.auctioneerId)
                .then(name => {
                    auctionDetails.auctioneer = {
                        name: name,
                        uuid: auctionDetails.auctioneerId
                    }
                })
                .catch(() => {
                    auctionDetails.auctioneer = {
                        name: name,
                        uuid: auctionDetails.auctioneerId
                    }
                    console.log(`No username for player ${auctionDetails.auctioneerId}`)
                    console.log('------------------------')
                })
        )
    } catch (e) {
        console.log('ERROR: ' + JSON.stringify(e))
        console.log('------------------------')
    }

    await Promise.allSettled(promises)

    return {
        props: {
            auctionDetails: auctionDetails,
            temItemDetails: temDetails || null
        }
    }
}

export default AuctionDetailsPage
