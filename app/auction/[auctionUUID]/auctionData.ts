import { cache } from 'react'
import { initAPI } from '../../../api/ApiHelper'
import { parseAuctionDetails } from '../../../utils/Parser/APIResponseParser'
import { getAuctionComponentEmbed } from '../../../utils/DiscordPageEmbeds'
import type { DiscordEmbedPayload } from '../../../utils/DiscordComponentEmbed'

// Data of the auction page, shared by the page, its metadata and its Discord embed route

// Valid auction ID formats:
// - 17 character hex string (e.g., "924c0480753e41aab")
// - UUID with dashes (e.g., "924c0480-753e-41aa-b123-456789abcdef")
// - UUID without dashes (e.g., "924c0480753e41aab123456789abcdef")
export function isValidAuctionIdFormat(id: string): boolean {
    if (!id) return false
    
    // 17 character hex string
    if (/^[0-9a-fA-F]{17}$/.test(id)) return true
    
    // UUID with dashes (8-4-4-4-12)
    if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id)) return true
    
    // UUID without dashes (32 hex chars)
    if (/^[0-9a-fA-F]{32}$/.test(id)) return true
    
    return false
}

// cache() shares the auction and its player names between generateMetadata and the page
export const getAuctionDetails = cache(async (auctionUUID: string) => {
    // Check if the auction ID format is valid before making API request
    if (!isValidAuctionIdFormat(auctionUUID)) {
        console.log('Invalid auction ID format: ' + auctionUUID)
        return null
    }

    const api = initAPI(true)
    let auctionDetails: Awaited<ReturnType<API['getAuctionDetails']>>['original']
    let unparsedAuctionDetails = ''
    try {
        const result = await api.getAuctionDetails(auctionUUID)
        auctionDetails = result.original
        unparsedAuctionDetails = JSON.stringify(result.original)
    } catch (e) {
        console.log(`ERROR fetching Auction Details (auctionUUID=${auctionUUID}): ${e instanceof Error ? e.message : JSON.stringify(e)}`)
        console.log('------------------------\n')
        return null
    }

    if (!auctionDetails) {
        console.log('auctionDetails not found (auctionUUID=' + auctionUUID + ')')
        console.log('------------------------\n')
        return null
    }

    auctionDetails.bids.sort((a, b) => b.amount - a.amount)

    const namePromises: Promise<void>[] = []
    try {
        auctionDetails.iconUrl = api.getItemImageUrl(auctionDetails)
        if (!auctionDetails.name) {
            auctionDetails.name = auctionDetails.itemName
        }

        auctionDetails.bids.forEach(bid => {
            const promise = api
                .getPlayerName(bid.bidder)
                .then(name => {
                    const newBidder = {
                        name: name,
                        uuid: bid.bidder
                    }
                    bid.bidder = newBidder
                })
                .catch(e => {
                    const newBidder = {
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
                        name: '',
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
})

/** The Discord embed of an auction; none for unknown or not yet indexed auctions */
export async function getAuctionPageEmbed(auctionUUID: string): Promise<DiscordEmbedPayload | null> {
    const auctionDetails = (await getAuctionDetails(auctionUUID))?.auctionDetails
    return auctionDetails ? getAuctionComponentEmbed(parseAuctionDetails(auctionDetails), Date.now()) : null
}
