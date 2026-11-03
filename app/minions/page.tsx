import { Container } from 'react-bootstrap'
import { initAPI } from '../../api/ApiHelper'
import { BottomBanner } from '../../components/BottomBanner/BottomBanner'
import { MinionCalculator } from '../../components/MinionCalculator/MinionCalculator'
import Search from '../../components/Search/Search'
import { ToolLandingSeo } from '../../components/Seo/ToolLandingSeo'
import { toolLandingSeoContent } from '../../components/Seo/toolLandingSeoContent'
import { getCanonicalUrl, getHeadMetadata } from '../../utils/SSRUtils'

const seoContent = toolLandingSeoContent.minions

const defaults: MinionRankingOptions = {
    offlineHours: 24,
    sell: 'offer',
    buy: 'instant',
    objective: 'coins',
    speedBoost: 0,
    hopper: 'none',
    compaction: true,
    derpy: false,
    limit: 10
}

type MinionSearchParams = Partial<Record<keyof MinionRankingOptions, string | string[]>>

function first(value?: string | string[]) {
    return Array.isArray(value) ? value[0] : value
}

function numberParam(value: string | undefined, fallback: number, minimum = 0) {
    const parsed = Number(value)
    return Number.isFinite(parsed) && parsed >= minimum ? parsed : fallback
}

function enumParam<T extends string>(value: string | undefined, values: readonly T[], fallback: T): T {
    return values.includes(value as T) ? (value as T) : fallback
}

function parseOptions(params: MinionSearchParams): MinionRankingOptions {
    const budgetValue = first(params.budget)
    const budget = budgetValue ? numberParam(budgetValue, 0) : undefined

    return {
        offlineHours: numberParam(first(params.offlineHours), defaults.offlineHours, 1),
        budget,
        sell: enumParam(first(params.sell), ['offer', 'instant', 'npc'] as const, defaults.sell),
        buy: enumParam(first(params.buy), ['instant', 'order'] as const, defaults.buy),
        objective: enumParam(first(params.objective), ['coins', 'experience'] as const, defaults.objective),
        speedBoost: numberParam(first(params.speedBoost), defaults.speedBoost),
        hopper: enumParam(first(params.hopper), ['none', 'budget', 'enchanted'] as const, defaults.hopper),
        compaction: first(params.compaction) !== 'false',
        derpy: first(params.derpy) === 'true',
        limit: Math.floor(Math.min(50, numberParam(first(params.limit), defaults.limit, 1)))
    }
}

export default async function Page({ searchParams }: { searchParams: Promise<MinionSearchParams> }) {
    const options = parseOptions(await searchParams)
    const ranking = await initAPI(true).getBestMinions(options)

    return (
        <>
            <Container>
                <Search />
                <h1>Hypixel SkyBlock Minion Calculator</h1>
                <p className="lead">Find the best minion for the time you actually leave it running.</p>
                <hr />
                <MinionCalculator initialRanking={ranking} initialOptions={options} />
                <ToolLandingSeo content={seoContent} />
            </Container>
            <BottomBanner />
        </>
    )
}

export const metadata = getHeadMetadata(seoContent.metadataTitle, seoContent.metadataDescription, undefined, undefined, undefined, getCanonicalUrl('/minions'))

export const revalidate = 0
