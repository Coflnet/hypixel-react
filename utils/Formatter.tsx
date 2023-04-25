import { CSSProperties } from 'react'
import { isClientSideRendering } from './SSRUtils'

/*
 Returns a given number as string with thousands-separators. Example:
 1234567 => 1.234.567
*/
export function numberWithThousandsSeparators(number?: number, thousandSeperator?: string, decimalSeperator?: string): string {
    if (!number) {
        return '0'
    }
    var parts = number.toString().split('.')
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeperator || getThousandSeparator())
    return parts.join(decimalSeperator || getDecimalSeparator())
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

    // special case for PET_SKIN to avoid confusion
    if (itemTag === 'PET_SKIN') {
        return 'Pet Skin (unapplied)'
    }

    // words that should remain lowercase
    const exceptions = ['of', 'the']

    function capitalizeWords(text: string): string {
        return text.replace(/\w\S*/g, function (txt) {
            if (exceptions.findIndex(a => a === txt) > -1) {
                return txt
            }
            return txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase()
        })
    }

    let formatted: string = itemTag.toString().replace(new RegExp('_', 'g'), ' ').toLowerCase()

    formatted = capitalizeWords(formatted)

    // special per item Formating
    formatted = formatted?.replace('Pet Item', '')
    if (formatted?.startsWith('Pet')) {
        formatted = formatted?.replace('Pet', '') + ' Pet'
    }
    if (formatted?.startsWith('Ring')) {
        formatted = formatted?.replace('Ring ', '') + ' Ring'
    }
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
        { type: 'UNKNOWN', colourCode: 'black' },
        { type: 'COMMON', colourCode: 'black' },
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
        color: color ? color.colourCode : undefined,
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
    var multMap = [
        { mult: 1e12, suffix: 'T' },
        { mult: 1e9, suffix: 'B' },
        { mult: 1e6, suffix: 'M' },
        { mult: 1e3, suffix: 'k' },
        { mult: 1, suffix: '' }
    ]
    var mult = multMap.find(m => num >= m.mult) || multMap[multMap.length - 1]
    return (num / mult.mult).toFixed(decimals) + mult.suffix
}

export function getThousandSeparator() {
    let langTag = isClientSideRendering() ? navigator.language : 'en'
    if (langTag.startsWith('en')) {
        return ','
    } else {
        return '.'
    }
}

export function getDecimalSeparator() {
    let langTag = isClientSideRendering() ? navigator.language : 'en'
    if (langTag.startsWith('en')) {
        return '.'
    } else {
        return ','
    }
}

/**
 * Returs a number from a short representation string of a price (e.g. 12M => 12_000_000)
 * @param shortString A string representing a larger number (e.g. 12M)
 * @returns The number represented by the string (e.g. 12_000_000)
 */
export function getNumberFromShortenString(shortString?: string): number | undefined {
    if (!shortString) {
        return
    }
    let val = [
        { value: 1e12, suffix: 'T' },
        { value: 1e12, suffix: 't' },
        { value: 1e9, suffix: 'B' },
        { value: 1e9, suffix: 'b' },
        { value: 1e6, suffix: 'M' },
        { value: 1e6, suffix: 'm' },
        { value: 1e3, suffix: 'K' },
        { value: 1e3, suffix: 'k' },
        { value: 1, suffix: '' }
    ].find(val => shortString.includes(val.suffix))
    return parseFloat(shortString.at(-1) == val.suffix ? shortString.slice(0, -1) : shortString) * val.value
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
    return `${numberWithThousandsSeparators(number)} Coins`
}
export function formatDungeonStarsInString(stringWithStars: string, style: CSSProperties = {}, dungeonItemLevelString?: string): JSX.Element {
    let yellowStarStyle = { color: '#ffaa00', fontWeight: 'normal', height: '100%' }
    let redStarStyle = { color: 'red', fontWeight: 'normal', height: '100%' }
    let itemNameStyle = {
        height: '32px',
        marginRight: '-5px'
    }
    let stars = stringWithStars?.match(/✪.*/gm)

    let numberOfMasterstars = 0
    if (dungeonItemLevelString) {
        try {
            numberOfMasterstars = Math.max(parseInt(dungeonItemLevelString) - 5, 0)
        } catch {}
    }

    if (!stars || stars.length === 0) {
        return <span style={style}>{stringWithStars}</span>
    }

    let starsString = stars[0]
    let itemName = stringWithStars.split(stars[0])[0]
    let starsLastChar = starsString.charAt(starsString.length - 1)
    let starWithNumber = starsLastChar === '✪' ? undefined : starsLastChar

    let normalStarElement = <span style={yellowStarStyle}>{'✪'.repeat(starsString.length - numberOfMasterstars)}</span>
    if (starWithNumber) {
        normalStarElement = <span style={yellowStarStyle}>{starsString.substring(0, starsString.length - 1)}</span>
    }

    return (
        <span style={style}>
            {itemName ? <span style={itemNameStyle}>{itemName}</span> : null} {normalStarElement}
            {starWithNumber || numberOfMasterstars ? (
                <span style={redStarStyle}>{starWithNumber ? starWithNumber : '✪'.repeat(numberOfMasterstars)}</span>
            ) : null}
        </span>
    )
}

export function getMinecraftColorCodedElement(text: string, autoFormat = true): JSX.Element {
    let styleMap: { [key: string]: React.CSSProperties } = {
        '0': { fontWeight: 'normal', textDecoration: 'none', color: '#000000' },
        '1': { fontWeight: 'normal', textDecoration: 'none', color: '#0000aa' },
        '2': { fontWeight: 'normal', textDecoration: 'none', color: '#00aa00' },
        '3': { fontWeight: 'normal', textDecoration: 'none', color: '#00aaaa' },
        '4': { fontWeight: 'normal', textDecoration: 'none', color: '#aa0000' },
        '5': { fontWeight: 'normal', textDecoration: 'none', color: '#aa00aa' },
        '6': { fontWeight: 'normal', textDecoration: 'none', color: '#ffaa00' },
        '7': { fontWeight: 'normal', textDecoration: 'none', color: '#aaaaaa' },
        '8': { fontWeight: 'normal', textDecoration: 'none', color: '#555555' },
        '9': { fontWeight: 'normal', textDecoration: 'none', color: '#5555ff' },
        a: { fontWeight: 'normal', textDecoration: 'none', color: '#55ff55' },
        b: { fontWeight: 'normal', textDecoration: 'none', color: '#55ffff' },
        c: { fontWeight: 'normal', textDecoration: 'none', color: '#FF5555' },
        d: { fontWeight: 'normal', textDecoration: 'none', color: '#FF55FF' },
        e: { fontWeight: 'normal', textDecoration: 'none', color: '#FFFF55' },
        f: { fontWeight: 'normal', textDecoration: 'none', color: '#FFFFFF' },
        l: { fontWeight: 'bold' },
        n: { textDecorationLine: 'underline', textDecorationSkip: 'spaces' },
        o: { fontStyle: 'italic' },
        m: { textDecoration: 'line-through', textDecorationSkip: 'spaces' }
    }

    let splits = text.split('§')
    let elements: JSX.Element[] = []

    splits.forEach((split, i) => {
        if (i === 0) {
            if (split !== '') {
                elements.push(<span key={i}>{split}</span>)
            }
            return
        }
        let code = split.substring(0, 1)
        let text = autoFormat ? convertTagToName(split.substring(1, split.length)) : split.substring(1, split.length)
        elements.push(
            <span key={i} style={styleMap[code]}>
                {text}
            </span>
        )
    })

    return <span>{elements}</span>
}

export function removeMinecraftColorCoding(text: string): string {
    return text.replace(/§[0-9a-fk-or]/gi, '')
}
