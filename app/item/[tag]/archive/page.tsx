import { Container } from 'react-bootstrap'
import { parseItem } from '../../../../utils/Parser/APIResponseParser'
import Search from '../../../../components/Search/Search'
import { convertTagToName } from '../../../../utils/Formatter'
import api from '../../../../api/ApiHelper'
import { Archive } from '@mui/icons-material'

export default async function Page({ searchParams, params }) {
    let tag = params.tag as string

    let item = parseItem({
        tag: tag,
        name: convertTagToName(tag),
        iconUrl: api.getItemImageUrl({ tag })
    })

    return (
        <>
            {}
            <Container>
                <Search selected={item} type="item" />
                <ArchivedAuction
            </Container>
        </>
    )
}

export async function generateMetadata({ params, searchParams }) {
    function getAvgPrice(prices) {
        let priceSum = 0

        prices.forEach(item => {
            priceSum += item.avg
        })

        return Math.round(priceSum / prices.length)
    }

    function getFiltersText(filter) {
        if (!filter) {
            return ' '
        }
        return `${Object.keys(filter)
            .map(key => `➡️ ${key}: ${filter[key]}`)
            .join('\n')}`
    }

    let tag = params?.tag as string
    let { item, filter, prices, range } = await getItemData(searchParams, params)
    if (hasFlag(item.flags, 1)) {
        let sellPriceSum = 0
        let buyPriceSum = 0

        prices.forEach(p => {
            sellPriceSum += p.sellData.price
            buyPriceSum += p.buyData.price
        })

        return getHeadMetadata(
            `${item.name || convertTagToName(tag)} price`,
            `🕑 ${range ? `Range: ${range}` : null}
            Avg Sell Price: ${sellPriceSum ? numberWithThousandsSeparators(Math.round(sellPriceSum / prices.length)) : '---'} 
            Avg Buy Price: ${buyPriceSum ? numberWithThousandsSeparators(Math.round(buyPriceSum / prices.length)) : '---'}`,
            item.iconUrl,
            [convertTagToName(item.tag)],
            `${item.name || convertTagToName(tag)} price | Hypixel SkyBlock AH history tracker`
        )
    }
    return getHeadMetadata(
        `${item.name || convertTagToName(tag)} price`,
        `💰 Price: ${getAvgPrice(prices) ? numberWithThousandsSeparators(Math.round(getAvgPrice(prices))) : '---'} Coins
        🕑 ${range ? `Range: ${range}` : null}

         ${filter ? `Filters: \n${getFiltersText(filter)}` : ''}`,
        item.iconUrl,
        [convertTagToName(item.tag)],
        `${item.name || convertTagToName(tag)} price | Hypixel SkyBlock AH history tracker`
    )
}
