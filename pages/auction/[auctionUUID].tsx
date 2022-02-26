import React, { useEffect } from 'react'
import AuctionDetails from '../../components/AuctionDetails/AuctionDetails'
import { useForceUpdate } from '../../utils/Hooks'
import { Container } from 'react-bootstrap'
import Search from '../../components/Search/Search'
import { useRouter } from 'next/router'
import api, { initAPI } from '../../api/ApiHelper'
import '../../public/MinecraftColorCodes.3.7'

interface Props {
    auctionDetails: any
}

function AuctionDetailsPage(props) {
    const router = useRouter()
    let auctionUUID = router.query.auctionUUID as string
    let forceUpdate = useForceUpdate()

    useEffect(() => {
        window.scrollTo(0, 0)
    }, [])

    useEffect(() => {
        forceUpdate()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [auctionUUID])

    return (
        <div className="page">
            <Container>
                <Search />
                <AuctionDetails auctionUUID={auctionUUID} auctionDetails={props.auctionDetails} />
            </Container>
        </div>
    )
}

export const getServerSideProps = async ({ query }) => {
    let api = initAPI(true)
    let auctionUUID = query.auctionUUID as string
    let auctionDetails: any = await api.getAuctionDetails(auctionUUID)
    auctionDetails.bids.sort((a, b) => b.amount - a.amount)
    let item = await api.getItemDetails(auctionDetails.tag)
    auctionDetails.description = item.description
    auctionDetails.iconUrl = api.getItemImageUrl(auctionDetails)
    if (!auctionDetails.name) {
        auctionDetails.name = item.name
    }

    let namePromises: Promise<void>[] = []
    auctionDetails.bids.forEach(bid => {
        let promise = api.getPlayerName(bid.bidder).then(name => {
            bid.bidder = {
                name: name,
                uuid: bid.bidder
            }
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
