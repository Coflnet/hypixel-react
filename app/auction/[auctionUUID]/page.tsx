import moment from 'moment'
import { notFound } from 'next/navigation'
import { initAPI } from '../../../api/ApiHelper'
import { getHeadMetadata } from '../../../utils/SSRUtils'
import { numberWithThousandsSeparators } from '../../../utils/Formatter'
import AuctionDetails from '../../../components/AuctionDetails/AuctionDetails'
import Search from '../../../components/Search/Search'
import { parseAuctionDetails } from '../../../utils/Parser/APIResponseParser'
import { Container } from 'react-bootstrap'

async function getAuctionDetails(auctionUUID: string) {
    let api = initAPI(true)
    let auctionDetails: any
    let unparsedAuctionDetails: any
    try {
        let result = await api.getAuctionDetails(auctionUUID)
        auctionDetails = result.original
        unparsedAuctionDetails = JSON.stringify(result.original)
    } catch (e) {
        console.log('ERROR fetching Auction Details: ' + JSON.stringify(e))
        console.log('------------------------\n')
        return null
    }

    if (!auctionDetails) {
        console.log('auctionDetails not found (auctionUUID=' + auctionUUID + ')')
        console.log('------------------------\n')
        return null
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
                .catch(e => {
                    let newBidder = {
                        name: '',
                        uuid: bid.bidder
                    }
                    bid.bidder = newBidder
                    console.error(`Error fetching playername for bidder ${newBidder.uuid}. ${JSON.stringify(e)}`)
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
                .catch(e => {
                    auctionDetails.auctioneer = {
                        name: name,
                        uuid: auctionDetails.auctioneerId
                    }
                    console.error(`Error fetching playername for auctioneer ${auctionDetails.auctioneerId}. ${JSON.stringify(e)}`)
                    console.log('------------------------\n')
                })
        )
    } catch (e) {
        console.log('ERROR building Auction Details: ' + JSON.stringify(e))
        console.log('------------------------\n')
    }

    await Promise.allSettled(namePromises)

    return {
        auctionDetails: auctionDetails,
        unparsedAuctionDetails: unparsedAuctionDetails
    }
}

export default async function Page({ params }) {
    let auctionUUID = params.auctionUUID
    let auctionDetailsResult = await getAuctionDetails(auctionUUID)
    let auctionDetails = auctionDetailsResult?.auctionDetails

    if (!auctionDetails) {
        notFound()
    }

    function getOriginalAuctionDetails() {
        try {
            return JSON.parse(auctionDetailsResult?.unparsedAuctionDetails)
        } catch (e) {}
        return null
    }

    return (
        <>
            <Container>
                <Search />
                <AuctionDetails auctionUUID={auctionUUID} auctionDetails={auctionDetails} unparsedAuctionDetails={getOriginalAuctionDetails()} />
            </Container>
        </>
    )
}

export async function generateMetadata({ params }) {
    function getAuctionDescription(auctionDetails): string {
        if (!auctionDetails) {
            return 'Browse over 600 million auctions, and the bazaar of Hypixel SkyBlock.'
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

    let auctionUUID = params.auctionUUID as string
    let auctionDetails = (await getAuctionDetails(auctionUUID))?.auctionDetails

    if (!auctionDetails) {
        return {}
    }

    auctionDetails = parseAuctionDetails(auctionDetails)

    return getHeadMetadata(
        `Auction for ${auctionDetails?.auction?.item?.name?.replaceAll(/§./g, '')} by ${
            auctionDetails?.auctioneer?.name
        } | Hypixel SkyBlock AH history tracker`,
        getAuctionDescription(auctionDetails),
        auctionDetails.auction.item.iconUrl,
        [auctionDetails.auction.item.name || auctionDetails.auction.item.tag, auctionDetails.auctioneer.name],
        `Auction for ${auctionDetails?.auction?.item?.name} by ${auctionDetails?.auctioneer?.name} | Hypixel SkyBlock AH history tracker`
    )
}

export const revalidate = 0
