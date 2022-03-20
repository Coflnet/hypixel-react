import React, { useEffect, useState } from 'react'
import AuctionDetails from '../../components/AuctionDetails/AuctionDetails'
import { useForceUpdate } from '../../utils/Hooks'
import { Container } from 'react-bootstrap'
import Search from '../../components/Search/Search'
import { useRouter } from 'next/router'
import api, { initAPI } from '../../api/ApiHelper'
import '../../public/MinecraftColorCodes.3.7'
import { parseAuctionDetails } from '../../utils/Parser/APIResponseParser'
import { getHeadElement } from '../../utils/SSRUtils'
import { numberWithThousandsSeperators } from '../../utils/Formatter'
import moment from 'moment'

interface Props {
    auctionDetails: any
}

function AuctionDetailsPage(props: Props) {
    const router = useRouter()
    let auctionUUID = router.query.auctionUUID as string
    let forceUpdate = useForceUpdate()
    let [auctionDetails, setAuctionDetails] = useState(parseAuctionDetails(props.auctionDetails))

    useEffect(() => {
        window.scrollTo(0, 0)
        if (!props.auctionDetails) {
            api.getAuctionDetails(auctionUUID).then(setAuctionDetails)
        }
    }, [])

    useEffect(() => {
        forceUpdate()
        getServerSideProps({ query: router.query }).then(auctionDetails => {
            setAuctionDetails(parseAuctionDetails(auctionDetails))
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [auctionUUID])

    useEffect(() => {
        forceUpdate()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [auctionDetails])

    function getAuctionDescription(): string {
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
            {getHeadElement(
                `Auction for ${auctionDetails?.auction?.item?.name} by ${auctionDetails?.auctioneer?.name} | Hypixel SkyBlock AH history tracker`,
                getAuctionDescription(),
                auctionDetails.auction.item.iconUrl,
                [auctionDetails.auction.item.name || auctionDetails.auction.item.tag, auctionDetails.auctioneer.name],
                `Auction for ${auctionDetails?.auction?.item?.name} by ${auctionDetails?.auctioneer?.name} | Hypixel SkyBlock AH history tracker`
            )}
            <Container>
                <Search />
                <AuctionDetails auctionUUID={auctionUUID} auctionDetails={auctionDetails} />
            </Container>
        </div>
    )
}

export const getServerSideProps = async ({ query }) => {
    let auctionUUID = query.auctionUUID as string
    let api = initAPI(true)
    let auctionDetails: any = await api.getAuctionDetails(auctionUUID)
    auctionDetails.bids.sort((a, b) => b.amount - a.amount)
    let item = await api.getItemDetails(auctionDetails.tag)
    auctionDetails.description = item.description
    auctionDetails.iconUrl = api.getItemImageUrl(auctionDetails)
    if (!auctionDetails.name) {
        auctionDetails.name = auctionDetails.itemName
    }

    let namePromises: Promise<void>[] = []
    auctionDetails.bids.forEach(bid => {
        let promise = api.getPlayerName(bid.bidder).then(name => {
            let newBidder = {
                name: name,
                uuid: bid.bidder
            }
            bid.bidder = newBidder
        })
        namePromises.push(promise)
    })
    namePromises.push(
        api.getPlayerName(auctionDetails.auctioneerId).then(name => {
            auctionDetails.auctioneer = {
                name: name,
                uuid: auctionDetails.auctioneerId
            }
        })
    )
    await Promise.all(namePromises)

    return {
        props: {
            auctionDetails: auctionDetails
        }
    }
}

export default AuctionDetailsPage
