import { Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { initAPI } from '../../../../api/ApiHelper'
import { FlipTracking } from '../../../../components/FlipTracking/FlipTracking'
import Search from '../../../../components/Search/Search'
import { numberWithThousandsSeparators, removeMinecraftColorCoding } from '../../../../utils/Formatter'
import { parseFlipTrackingResponse, parsePlayer } from '../../../../utils/Parser/APIResponseParser'
import { getHeadMetadata } from '../../../../utils/SSRUtils'
import RBContainer from '../../../../components/ReactBootstrapWrapper/Container'

export default async function Page({ params }) {
    let flipData = await getFlipData(params.uuid)

    let flipTrackingResponse = parseFlipTrackingResponse(flipData.flipTrackingResponse)
    let player = parsePlayer(flipData.player)

    return (
        <>
            <RBContainer>
                <Search
                    type="player"
                    currentElement={
                        <p>
                            <span style={{ fontSize: 'larger', marginRight: '20px' }}>Tracked flips of:</span>
                            <Link href={`/player/${player.uuid}`} className="disableLinkStyle">
                                <span style={{ cursor: 'pointer' }}>
                                    <Image
                                        crossOrigin="anonymous"
                                        className="playerHeadIcon"
                                        src={player.iconUrl || ''}
                                        height="32"
                                        width="32"
                                        alt=""
                                        style={{ marginRight: '10px' }}
                                    />
                                    <span>{player.name}</span>
                                </span>
                            </Link>
                        </p>
                    }
                />
                <Suspense>
                    <FlipTracking totalProfit={flipTrackingResponse.totalProfit} trackedFlips={flipTrackingResponse.flips} />
                </Suspense>
            </RBContainer>
        </>
    )
}

async function getFlipData(uuid) {
    let api = initAPI(true)
    let apiResponses = await Promise.all([api.getPlayerName(uuid), api.getTrackedFlipsForPlayer(uuid)].map(p => p.catch(e => null)))

    return {
        player: {
            uuid: uuid,
            name: apiResponses[0]
        },
        flipTrackingResponse: apiResponses[1] || { flips: [], totalProfit: 0 }
    }
}

export async function generateMetadata({ params }) {
    let { flipTrackingResponse, player } = await getFlipData(params.uuid)
    let parsedPlayer = parsePlayer(player)

    return getHeadMetadata(
        `Tracked flips of ${parsedPlayer.name}`,
        getEmbedDescription(parseFlipTrackingResponse(flipTrackingResponse), parsedPlayer),
        parsedPlayer.iconUrl?.split('?')[0],
        ['tracker'],
        `Tracked flips of ${parsedPlayer.name}`
    )
}

export function getEmbedDescription(flipTrackingResponse: FlipTrackingResponse, player: Player) {
    if (!flipTrackingResponse.flips || flipTrackingResponse.flips.length === 0) {
        return `There were no flips found for ${player.name}`
    }

    let profitByFinder = {}
    flipTrackingResponse.flips.forEach(flip => {
        if (!flip.finder.label) {
            return
        }
        if (!profitByFinder[flip.finder.label]) {
            profitByFinder[flip.finder.label] = 0
        }
        profitByFinder[flip.finder.label] += flip.profit
    })

    let finderByGroupArray: any[] = []
    Object.keys(profitByFinder).forEach(key => {
        finderByGroupArray.push({
            label: key,
            profit: profitByFinder[key]
        })
    })
    finderByGroupArray = finderByGroupArray.sort((a, b) => b.profit - a.profit)

    let profitByFinderEmbed = ''
    finderByGroupArray.forEach(finderGroup => {
        if (finderGroup.profit > 0) {
            profitByFinderEmbed += `${finderGroup.label}: ${numberWithThousandsSeparators(finderGroup.profit)} Coins \n`
        }
    })

    let sortedFlips = flipTrackingResponse.flips.sort((a, b) => b.profit - a.profit);

    let highestProfitFlip = sortedFlips[0]
    let highestProfitFlipText = `Highest Profit Flip: ${numberWithThousandsSeparators(highestProfitFlip.profit)} Coins \n ${numberWithThousandsSeparators(
        highestProfitFlip.pricePaid
    )} Coins ➞ ${numberWithThousandsSeparators(highestProfitFlip.soldFor)} Coins (${removeMinecraftColorCoding(highestProfitFlip.item.name)})`

    let lowestProfitFlip = sortedFlips[sortedFlips.length-1]
    let lowestProfitFlipText = `Lowest Profit Flip: ${numberWithThousandsSeparators(lowestProfitFlip.profit)} Coins \n ${numberWithThousandsSeparators(
        lowestProfitFlip.pricePaid
    )} Coins ➞ ${numberWithThousandsSeparators(lowestProfitFlip.soldFor)} Coins (${removeMinecraftColorCoding(lowestProfitFlip.item.name)})`

    return `Found Flips: ${flipTrackingResponse.flips.length} 
            Total Profit: ${numberWithThousandsSeparators(flipTrackingResponse.totalProfit)} Coins
            \n${profitByFinderEmbed} 
            ${highestProfitFlipText}
            \n${lowestProfitFlipText}`
}

export const revalidate = 0
