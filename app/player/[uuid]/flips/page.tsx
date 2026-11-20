import { Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { FlipTracking } from '../../../../components/FlipTracking/FlipTracking'
import Search from '../../../../components/Search/Search'
import { numberWithThousandsSeparators, removeMinecraftColorCoding } from '../../../../utils/Formatter'
import { parseFlipTrackingResponse, parsePlayer } from '../../../../utils/Parser/APIResponseParser'
import { getHeadMetadata, getCanonicalUrl, applyPlayerRobots } from '../../../../utils/SSRUtils'
import { Container } from 'react-bootstrap'
import { getFlipListEmbedDescription, getPlayerEmbedOptions, getPlayerHeadRenderUrl } from '../../../../utils/EmbedUtils'
import { DiscordEmbedLink } from '../../../../components/DiscordEmbed/DiscordEmbedLink'
import { getFlipData } from './flipData'

export default async function Page(props) {
    const params = await props.params
    const flipData = await getFlipData(params.uuid)

    const flipTrackingResponse = parseFlipTrackingResponse(flipData.flipTrackingResponse)
    const player = parsePlayer(flipData.player)

    const sortedFlips = flipTrackingResponse.flips.sort((a, b) => b.profit - a.profit)
    const bestFlip = sortedFlips.length > 0 ? sortedFlips[0] : null
    
    const enchantments = ["Ultimate Chimera 5", "Sharpness 6", "Protection 7", "Growth 7", "Power 7", "Giant Killer 6", "Thunderlord 6", "Looting 4"]
    const sampleEnchantment = enchantments[(player.name?.length || 0) % enchantments.length]

    return (
        <>
            <DiscordEmbedLink segments={['player', params.uuid, 'flips']} />
            <Container>
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
                    <FlipTracking totalProfit={flipTrackingResponse.totalProfit} trackedFlips={flipTrackingResponse.flips} playerUUID={params.uuid} loadError={flipData.loadError} />
                </Suspense>
                <div style={{ marginBottom: '20px', marginTop: '10px' }}>
                    <p>
                        This page displays all the flips of <b>{player.name}</b> in the last 7 days.
                        It supports lowball tracking if the user or the player they traded with uses <Link href="/mod">our mod</Link>.
                        It also accounts for any attribute changes done to items like applying enchantments (e.g. {sampleEnchantment}), hot potato books, adding reforges, etc.
                        You can find such flips on the <Link href="/attributeFlips">Attribute Flips</Link> page.
                        Some craft flips of item upgrading are also supported in tracking like necrons handle to hyperion (<Link href="/crafts">Crafts</Link>).
                    </p>
                    {flipTrackingResponse.totalProfit > 0 && (
                        <p>
                            In the last week, <b>{player.name}</b> made <b>{numberWithThousandsSeparators(flipTrackingResponse.totalProfit)}</b> coins profit.
                            {bestFlip && (
                                <> Their best flip was <b>{removeMinecraftColorCoding(bestFlip.item.name)}</b> for <b>{numberWithThousandsSeparators(bestFlip.profit)}</b> profit.</>
                            )}
                        </p>
                    )}
                </div>
            </Container>
        </>
    )
}

export async function generateMetadata(props) {
    const params = await props.params
    const { flipTrackingResponse, player, loadError } = await getFlipData(params.uuid)
    const parsedPlayer = parsePlayer(player)

    const metadata = getHeadMetadata(
        `Tracked flips of ${parsedPlayer.name}`,
        loadError || getFlipListEmbedDescription(parseFlipTrackingResponse(flipTrackingResponse), parsedPlayer.name),
        getPlayerHeadRenderUrl(params.uuid),
        ['tracker'],
        `${parsedPlayer.name} | Tracked Flips`,
        getCanonicalUrl(`/player/${params.uuid}/flips`),
        getPlayerEmbedOptions(parsedPlayer.name)
    )
    return applyPlayerRobots(metadata, params.uuid)
}

export const revalidate = 0
