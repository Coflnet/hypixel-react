import moment from 'moment'
import { initAPI } from '../../../api/ApiHelper'
import { getHeadMetadata, getCanonicalUrl } from '../../../utils/SSRUtils'
import { numberWithThousandsSeparators } from '../../../utils/Formatter'
import AuctionDetails from '../../../components/AuctionDetails/AuctionDetails'
import Search from '../../../components/Search/Search'
import { parseAuctionDetails } from '../../../utils/Parser/APIResponseParser'
import { Container } from 'react-bootstrap'
import { BottomBanner } from '../../../components/BottomBanner/BottomBanner'
import Link from 'next/link'

// Valid auction ID formats:
// - 17 character hex string (e.g., "924c0480753e41aab")
// - UUID with dashes (e.g., "924c0480-753e-41aa-b123-456789abcdef")
// - UUID without dashes (e.g., "924c0480753e41aab123456789abcdef")
function isValidAuctionIdFormat(id: string): boolean {
    if (!id) return false
    
    // 17 character hex string
    if (/^[0-9a-fA-F]{17}$/.test(id)) return true
    
    // UUID with dashes (8-4-4-4-12)
    if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id)) return true
    
    // UUID without dashes (32 hex chars)
    if (/^[0-9a-fA-F]{32}$/.test(id)) return true
    
    return false
}

async function getAuctionDetails(auctionUUID: string) {
    // Check if the auction ID format is valid before making API request
    if (!isValidAuctionIdFormat(auctionUUID)) {
        console.log('Invalid auction ID format: ' + auctionUUID)
        return null
    }

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

export default async function Page(props) {
    const params = await props.params
    let auctionUUID = params.auctionUUID
    let auctionDetailsResult = await getAuctionDetails(auctionUUID)
    let auctionDetails = auctionDetailsResult?.auctionDetails

    if (!auctionDetails) {
        const isValidFormat = isValidAuctionIdFormat(auctionUUID)
        
        return (
            <>
                <Container>
                    <Search />
                    <div style={{ marginTop: '40px', textAlign: 'center' }}>
                        <h1>Auction Not Found</h1>
                        {isValidFormat ? (
                            <div className="card" style={{ marginTop: '20px', textAlign: 'left', maxWidth: '700px', margin: '20px auto' }}>
                                <div className="card-header bg-warning text-dark">
                                    <h4 style={{ margin: 0 }}>🔍 This auction is currently not known</h4>
                                </div>
                                <div className="card-body">
                                    <p>
                                        The auction ID <code>{auctionUUID}</code> appears to be valid, but we couldn't find it in our database.
                                    </p>
                                    <hr />
                                    <p className="mb-0">
                                        <strong>This could mean:</strong>
                                    </p>
                                    <ul style={{ marginTop: '10px' }}>
                                        <li><strong>Very old auction:</strong> This auction may no longer be available in our archive.</li>
                                        <li><strong>Very new auction:</strong> This auction might have just been created. Try again in a minute when it should be indexed.</li>
                                    </ul>
                                    <div style={{ marginTop: '15px' }}>
                                        <Link href="/" className="btn btn-primary me-2">Go to Homepage</Link>
                                        <Link
                                            href={`/auction/${auctionUUID}`}
                                            className="btn btn-outline-secondary"
                                        >
                                            Try Again
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="card" style={{ marginTop: '20px', textAlign: 'left', maxWidth: '700px', margin: '20px auto' }}>
                                <div className="card-header bg-danger text-white">
                                    <h4 style={{ margin: 0 }}>❌ Invalid Auction ID Format</h4>
                                </div>
                                <div className="card-body">
                                    <p>
                                        The value <code>{auctionUUID}</code> is not a valid auction ID.
                                    </p>
                                    <hr />
                                    <p className="mb-0">
                                        <strong>Valid auction ID formats:</strong>
                                    </p>
                                    <ul style={{ marginTop: '10px' }}>
                                        <li>Short id (e.g., <code>924c0480753e41aab</code>)</li>
                                        <li>UUID without dashes (e.g., <code>924c0480753e41aab123456789abcdef</code>)</li>
                                    </ul>
                                    <p style={{ marginTop: '15px' }}>
                                        Please check the link for typos, or ask the person who shared this link with you to correct it.
                                    </p>
                                    <div style={{ marginTop: '15px' }}>
                                        <Link href="/" className="btn btn-primary">Go to Homepage</Link>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </Container>
                <BottomBanner />
            </>
        )
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
                <AuctionDetails
                    auctionUUID={auctionUUID}
                    auctionDetails={auctionDetails}
                    unparsedAuctionDetails={getOriginalAuctionDetails()}
                    copyButtonValue="ingame"
                />
            </Container>
            <BottomBanner />
        </>
    )
}

export async function generateMetadata(props) {
    const params = await props.params
    function getAuctionDescription(auctionDetails): string {
        if (!auctionDetails) {
            return 'Browse over 800 million auctions, and the bazaar of Hypixel SkyBlock.'
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
        `Auction for ${auctionDetails?.auction?.item?.name} by ${auctionDetails?.auctioneer?.name} | Hypixel SkyBlock AH history tracker`,
        getCanonicalUrl(`/auction/${auctionUUID}`)
    )
}

export const revalidate = 0
