import moment from 'moment'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { Container } from 'react-bootstrap'
import { initAPI } from '../../api/ApiHelper'
import AuctionDetails from '../../components/AuctionDetails/AuctionDetails'
import Search from '../../components/Search/Search'
import { getCacheControlHeader } from '../../utils/CacheUtils'
import { numberWithThousandsSeparators } from '../../utils/Formatter'
import { useForceUpdate } from '../../utils/Hooks'
import { parseAuctionDetails } from '../../utils/Parser/APIResponseParser'
import { getHeadElement } from '../../utils/SSRUtils'

interface Props {
    auctionDetails: any
    unparsedAuctionDetails: any
}

function AuctionDetailsPage(props: Props) {
    const router = useRouter()
    let auctionUUID = router.query.auctionUUID as string
    let forceUpdate = useForceUpdate()
    let [auctionDetails] = useState(props.auctionDetails ? parseAuctionDetails(props.auctionDetails) : undefined)

    useEffect(() => {
        window.scrollTo(0, 0)

        if (auctionDetails && auctionDetails.auction.uuid !== auctionUUID) {
            window.location.reload()
        }
    }, [auctionUUID])

    useEffect(() => {
        forceUpdate()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [auctionDetails])

    function getAuctionDescription(): string {
        if (!auctionDetails) {
            return 'Browse over 500 million auctions, and the bazaar of Hypixel SkyBlock.'
        }

        let description = ''
        if (auctionDetails.auction.bin) {
            description += 'BIN '
        }
        description += `Auction for ${auctionDetails?.auction?.item?.name?.replaceAll(/§./g, '')} by ${auctionDetails?.auctioneer?.name}`
        if (!auctionDetails.auction.bin) {
            description += `| Highest Bid: ${numberWithThousandsSeparators(auctionDetails.auction.highestBid)} Coins with ${auctionDetails.bids.length} Bids`
        } else if (auctionDetails.bids.length > 0) {
            description += `| Bought by ${auctionDetails.bids[0].bidder.name} for  ${numberWithThousandsSeparators(auctionDetails.auction.highestBid)} Coins`
        }

        description += ` | ${auctionDetails.auction.end > new Date() ? 'Ends' : 'Ended'} on ${moment(auctionDetails.auction.end).format(
            'MMMM Do YYYY, h:mm:ss a'
        )}`
        return (description += ` | Category: ${auctionDetails.auction.item.category} | Rarity: ${auctionDetails.auction.item.tier}`)
    }

    return (
        <div className="page">
            {auctionDetails
                ? getHeadElement(
                      `Auction for ${auctionDetails?.auction?.item?.name?.replaceAll(/§./g, '')} by ${
                          auctionDetails?.auctioneer?.name
                      } | Hypixel SkyBlock AH history tracker`,
                      getAuctionDescription(),
                      auctionDetails.auction.item.iconUrl,
                      [auctionDetails.auction.item.name || auctionDetails.auction.item.tag, auctionDetails.auctioneer.name],
                      `Auction for ${auctionDetails?.auction?.item?.name} by ${auctionDetails?.auctioneer?.name} | Hypixel SkyBlock AH history tracker`
                  )
                : getHeadElement()}
            <Container>
                <Search />
                <AuctionDetails auctionUUID={auctionUUID} auctionDetails={auctionDetails} unparsedAuctionDetails={JSON.parse(props.unparsedAuctionDetails)} />
            </Container>
        </div>
    )
}

export const getServerSideProps = async ({ res, params }) => {
    res.setHeader('Cache-Control', getCacheControlHeader())

    let auctionUUID = params.auctionUUID as string
    let api = initAPI(true)
    let auctionDetails: any
    let unparsedAuctionDetails: any
    try {
        let result = await api.getAuctionDetails(auctionUUID)
        auctionDetails = result.original
        unparsedAuctionDetails = JSON.stringify(result.original)
    } catch (e) {
        console.log('ERROR: ' + JSON.stringify(e))
        console.log('------------------------\n')
        return {
            notFound: true
        }
    }

    if (!auctionDetails) {
        console.log('auctionDetails not found (auctionUUID=' + auctionUUID + ')')
        console.log('------------------------\n')
        return {
            notFound: true
        }
    }

    auctionDetails.bids.sort((a, b) => b.amount - a.amount)

    let namePromises: Promise<void>[] = []
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
                    console.log(`No username for player ${JSON.stringify(bid.bidder)}`)
                    console.log('------------------------\n')
                })
            namePromises.push(promise)
        })
        namePromises.push(
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
                    console.log('------------------------\n')
                })
        )
    } catch (e) {
        console.log('ERROR: ' + JSON.stringify(e))
        console.log('------------------------\n')
    }

    await Promise.allSettled(namePromises)

    return {
        props: {
            auctionDetails: auctionDetails,
            unparsedAuctionDetails: unparsedAuctionDetails
        }
    }
}

export default AuctionDetailsPage
