import { CSSProperties } from 'react'
import { isClientSideRendering } from './SSRUtils'

/*
 Returns a given number as string with thousands-seperators. Example:
 1234567 => 1.234.567
*/
export function numberWithThousandsSeperators(number?: number): string {
    if (!number) {
        return '0'
    }
    var parts = number.toString().split('.')
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, getThousandSeperator())
    return parts.join(getDecimalSeperator())
}

/**
 * Converts a tag (e.g. WOODEN_AXE) to a item name (e.g. Wooden Axe)
 * - replaces all _ with spaces
 * - lowercases the word exept first letter (with exception of the defined words)
 * @param item
 */
export function convertTagToName(itemTag?: string): string {
    if (!itemTag) {
        return ''
    }

    // words that should remain lowercase
    const exceptions = ['of', 'the']

    function capitalizeWords(text: string): string {
        return text.replace(/\w\S*/g, function (txt) {
            if (exceptions.findIndex(a => a === txt) > -1) {
                return txt
            }
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        })
    }

    let formatted: string = itemTag.toString().replace(new RegExp('_', 'g'), ' ').toLowerCase()

    formatted = capitalizeWords(formatted)
    // special per item Formating
    formatted = formatted?.replace('Pet Item', '')
    if (formatted?.startsWith('Pet')) formatted = formatted?.replace('Pet', '') + ' Pet'
    if (formatted?.startsWith('Ring')) formatted = formatted?.replace('Ring ', '') + ' Ring'
    return formatted
}

/**
 * Converts a camelCase string (e.g. woodenAxe) to a sentence case (e.g. Wooden axe)
 * @param camelCase
 */
export function camelCaseToSentenceCase(camelCase: string): string {
    const exceptions = ['UId']

    if (exceptions.findIndex(a => a === camelCase) > -1) {
        return camelCase
    }

    var result = camelCase.replace(/([A-Z])/g, ' $1')
    var finalResult = result.split(' ')
    var isFirstWord = true
    finalResult.forEach((word, i) => {
        if (word !== '' && isFirstWord) {
            isFirstWord = false
            return
        }
        finalResult[i] = word.toLowerCase()
    })
    return finalResult.join(' ')
}

export function getStyleForTier(tier?: string | number): CSSProperties {
    interface TierColour {
        colourCode: string
        type: string
    }

    let tierColors: TierColour[] = [
        { type: 'UNKOWN', colourCode: 'black' },
        { type: 'COMMON', colourCode: 'white' },
        { type: 'UNCOMMON', colourCode: '#55ff55' },
        { type: 'RARE', colourCode: '#5555ff' },
        { type: 'EPIC', colourCode: '#aa00aa' },
        { type: 'LEGENDARY', colourCode: '#ffaa00' },
        { type: 'SPECIAL', colourCode: '#FF5555' },
        { type: 'VERY_SPECIAL', colourCode: '#FF5555' },
        { type: 'MYTHIC', colourCode: '#ff55ff' },
        { type: 'SUPREME', colourCode: '#AA0000' }
    ]

    let color: TierColour | undefined

    if (tier) {
        //!tier ? DEFAULT_COLOR : (TIER_COLORS[tier.toString().toUpperCase()] ||
        if (!isNaN(Number(tier))) {
            color = tierColors[tier]
        } else {
            color = tierColors.find(color => {
                return color.type === tier.toString().toUpperCase()
            })
        }
    }

    return {
        color: color ? color.colourCode : tierColors[0].colourCode,
        fontFamily: 'monospace',
        fontWeight: 'bold'
    }
}

export function enchantmentAndReforgeCompare(a: Enchantment | Reforge, b: Enchantment | Reforge): number {
    let aName = a.name ? a.name.toLowerCase() : ''
    let bName = b.name ? b.name.toLowerCase() : ''

    if (aName === 'any' || (aName === 'none' && bName !== 'any')) {
        return -1
    }
    if (bName === 'any' || bName === 'none') {
        return 1
    }

    return aName.localeCompare(bName)
}

export function formatToPriceToShorten(num: number, decimals: number = 0): string {
    // Ensure number has max 3 significant digits (no rounding up can happen)
    let i = Math.pow(10, Math.max(0, Math.log10(num) - 2))
    num = (num / i) * i

    if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(decimals) + 'B'
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(decimals) + 'M'
    if (num >= 1_000) return (num / 1_000).toFixed(decimals) + 'k'

    return num.toFixed(0)
}

export function getThousandSeperator() {
    let langTag = isClientSideRendering() ? navigator.language : 'en'
    if (langTag.startsWith('en')) {
        return ','
    } else {
        return '.'
    }
}

export function getDecimalSeperator() {
    let langTag = isClientSideRendering() ? navigator.language : 'en'
    if (langTag.startsWith('en')) {
        return '.'
    } else {
        return ','
    }
}

/**
 * Returs a number from a short represantation string of a price (e.g. 12M => 12_000_000)
 * @param shortString A string representing a larger number (e.g. 12M)
 * @returns The number represented by the string (e.g. 12_000_000)
 */
export function getNumberFromShortenString(shortString?: string): number | undefined {
    if (!shortString) {
        return
    }
    let split
    let multiplier
    if (shortString.indexOf('B') !== -1) {
        split = shortString.split('B')
        multiplier = 1000000000
    }
    if (shortString.indexOf('M') !== -1) {
        split = shortString.split('M')
        multiplier = 1000000
    }
    if (shortString.indexOf('K') !== -1) {
        split = shortString.split('K')
        multiplier = 1000
    }
    if (!split) {
        split = [shortString]
        multiplier = 1
    }
    if (split[0] && !isNaN(+split[0])) {
        return parseInt(split[0]) * multiplier
    }
}

export function getLocalDateAndTime(d: Date): string {
    if (!d) {
        return ''
    }
    return d.toLocaleDateString() + ', ' + d.toLocaleTimeString()
}

export function formatAsCoins(number: number): string {
    if (typeof number === 'string') {
        try {
            number = parseInt(number)
        } catch {
            return ''
        }
    }
    return `${numberWithThousandsSeperators(number)} Coins`
}
export function formatDungeonStarsInString(stringWithStars: string, style: CSSProperties = {}, dungeonItemLevelString?: string): JSX.Element {
    let yellowStarStyle = { color: 'yellow', fontWeight: 'normal', height: '100%' }
    let redStarStyle = { color: 'red', fontWeight: 'normal', height: '100%' }
    let itemNameStyle = {
        height: '32px',
        marginRight: '-5px'
    }
    let stars = stringWithStars?.match(/✪.*/gm)

    let numberOfMasterstars = undefined
    if (dungeonItemLevelString) {
        try {
            let number = parseInt(dungeonItemLevelString)
            if (number > 5) {
                numberOfMasterstars = number - 5
            }
        } catch {}
    }

    if (!stars || stars.length === 0) {
        return <span style={style}>{stringWithStars}</span>
    }

    let starsString = stars[0]
    let itemName = stringWithStars.split(stars[0])[0]
    let starsLastChar = starsString.charAt(starsString.length - 1)
    let starWithNumber = starsLastChar === '✪' ? undefined : starsLastChar

    let normalStarElement = <span style={yellowStarStyle}>{starsString}</span>
    if (!starWithNumber && numberOfMasterstars) {
        let redStarsString = ''
        let yellowStarsString = ''
        for (let index = 0; index < numberOfMasterstars; index++) {
            redStarsString += '✪'
        }
        for (let index = 0; index < starsString.length - numberOfMasterstars; index++) {
            yellowStarsString += '✪'
        }
        normalStarElement = (
            <span>
                <span style={redStarStyle}>{redStarsString}</span>
                <span style={yellowStarStyle}>{yellowStarsString}</span>
            </span>
        )
    }
    if (starWithNumber) {
        normalStarElement = <span style={yellowStarStyle}>{starsString.substring(0, starsString.length - 1)}</span>
    }

    return (
        <span style={style}>
            {itemName ? <span style={itemNameStyle}>{itemName}</span> : null}
            {normalStarElement}
            {starWithNumber ? <span style={redStarStyle}>{starWithNumber}</span> : null}
        </span>
    )
}
