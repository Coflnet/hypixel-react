import { getHeadMetadata, getCanonicalUrl } from '../../../utils/SSRUtils'
import { cleanName, getAuctionEmbedDescription } from '../../../utils/EmbedUtils'
import AuctionDetails from '../../../components/AuctionDetails/AuctionDetails'
import Search from '../../../components/Search/Search'
import { parseAuctionDetails } from '../../../utils/Parser/APIResponseParser'
import { Container } from 'react-bootstrap'
import { BottomBanner } from '../../../components/BottomBanner/BottomBanner'
import Link from 'next/link'
import { DiscordEmbedLink } from '../../../components/DiscordEmbed/DiscordEmbedLink'
import { getAuctionDetails, isValidAuctionIdFormat } from './auctionData'

export default async function Page(props) {
    const params = await props.params
    const auctionUUID = params.auctionUUID
    const auctionDetailsResult = await getAuctionDetails(auctionUUID)
    const auctionDetails = auctionDetailsResult?.auctionDetails

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
            return JSON.parse(auctionDetailsResult?.unparsedAuctionDetails || '')
        } catch {
            // Invalid original data has no details to display.
        }
        return null
    }

    return (
        <>
            <DiscordEmbedLink segments={['auction', auctionUUID]} />
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
    const auctionUUID = params.auctionUUID as string
    const rawAuctionDetails = (await getAuctionDetails(auctionUUID))?.auctionDetails

    if (!rawAuctionDetails) {
        // unknown or not yet indexed auction: the generic site embed
        return getHeadMetadata(undefined, undefined, undefined, [], 'SkyBlock Auction', getCanonicalUrl(`/auction/${auctionUUID}`))
    }

    const auctionDetails = parseAuctionDetails(rawAuctionDetails)
    const itemName = cleanName(auctionDetails.auction.item.name) || auctionDetails.auction.item.tag
    const seller = auctionDetails.auctioneer?.name
    const auctionTitle = seller ? `${itemName} by ${seller}` : itemName

    return getHeadMetadata(
        `Auction for ${auctionTitle} | Hypixel SkyBlock AH history tracker`,
        getAuctionEmbedDescription(auctionDetails, Date.now()),
        auctionDetails.auction.item.iconUrl,
        [itemName, seller].filter((keyword): keyword is string => !!keyword),
        `${auctionTitle} | SkyBlock Auction`,
        getCanonicalUrl(`/auction/${auctionUUID}`),
        // item icons are 16x16 to 64x64 depending on the item, so no size is claimed
        { imageAlt: `${itemName} icon` }
    )
}

export const revalidate = 0
