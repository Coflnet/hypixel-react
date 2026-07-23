import { CSSProperties, cloneElement, type JSX } from 'react'
import { isClientSideRendering } from './SSRUtils'
import { update } from 'idb-keyval'

/*
 Returns a given number as string with thousands-separators. Example:
 1234567 => 1.234.567
*/
export function numberWithThousandsSeparators(number?: number, thousandSeperator?: string, decimalSeperator?: string): string {
    if (!number) {
        return '0'
    }
    // no explicit separators: fall back to the viewer's locale (default behaviour)
    if (thousandSeperator === undefined && decimalSeperator === undefined) {
        return number.toLocaleString()
    }
    // explicit separators: group deterministically (used for SSR and the price inputs)
    let [intPart, decPart] = Math.abs(number).toString().split('.')
    let grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeperator ?? '')
    let sign = number < 0 ? '-' : ''
    return decPart !== undefined ? `${sign}${grouped}${decimalSeperator ?? '.'}${decPart}` : `${sign}${grouped}`
}

/*
 Groups the digits of a numeric input value with spaces every three digits so big prices are
 readable while typing. Example: "3333333" => "3 333 333". Non-digits are stripped; empty stays
 empty (so a cleared input doesn't show "0").
*/
export function formatThousandsSpaced(value: string | number): string {
    let digits = parseFormattedNumber(value.toString())
    if (!digits) {
        return ''
    }
    return numberWithThousandsSeparators(Number(digits), ' ')
}

/*
 Strips any grouping/formatting back to a plain digit string, e.g. "3 333 333" => "3333333".
*/
export function parseFormattedNumber(value: string): string {
    return value.replace(/\D/g, '')
}

/**
 * Craft ingredient data comes from the NotEnoughUpdates (NEU) dataset, which encodes legacy
 * Minecraft "id:damage" variants (colored wool/dye, logs, stained glass/clay, carpet, ...) with a
 * HYPHEN for filesystem-safety, e.g. "INK_SACK-4" for lapis lazuli. The real Hypixel/Coflnet tag -
 * used for item images and item-detail links - keys these the legacy way, with a COLON:
 * "INK_SACK:4". Without converting, these ingredients 404 on both their icon and their item page.
 * Mirrors `CalculatorService.ToVariantMarketTag` in the SkyCrafts backend - keep both in sync.
 * Tags that don't match the trailing-numeric-variant pattern (the vast majority - normal tags never
 * look like this) are returned unchanged, so this is safe to apply unconditionally.
 * @param tag An item tag, possibly in NEU hyphen-variant form
 */
export function toVariantItemTag(tag: string): string {
    if (!tag) {
        return tag
    }
    let match = tag.match(/^([A-Za-z0-9_]+)-(\d+)$/)
    return match ? `${match[1]}:${match[2]}` : tag
}

/**
 * Computes the "should be crafted" badge data for a craft ingredient client-side, from the raw
 * cost fields the backend returns. An ingredient is a subcraft when it is itself craftable
 * (`type === 'craft'`) and crafting it out beats buying it on the bazaar/auction house.
 * @param ingredient The ingredient (or generated Ingredient) to evaluate
 */
export function getCraftSavings(ingredient: { buyOrderCost?: number | null; craftCost?: number | null; type?: string | null }) {
    const buyOrderCost = ingredient.buyOrderCost ?? 0
    const craftCost = ingredient.craftCost ?? 0
    const isSubcraft = ingredient.type === 'craft'
    const craftSavings = isSubcraft && craftCost > 0 && buyOrderCost > craftCost ? buyOrderCost - craftCost : 0
    const craftSavingsPercent = craftSavings > 0 && buyOrderCost > 0 ? (craftSavings / buyOrderCost) * 100 : 0
    return { isSubcraft, craftSavings, craftSavingsPercent }
}

/**
 * Given an ingredient's cheap-channel capacity/price data and the total quantity needed,
 * computes the optimal acquisition split between placing a bazaar buy order (cheap, capped)
 * and insta-buying the remainder (more expensive, uncapped). Returns null when there's no
 * usable data (backend hasn't populated these fields yet).
 */
export type AcquisitionMode = 'order' | 'insta'

export interface AcquisitionBucket {
    qty: number
    unitPrice: number
    cost: number
}

export interface AcquisitionPlan {
    mode: AcquisitionMode
    npc: AcquisitionBucket
    order: AcquisitionBucket
    insta: AcquisitionBucket
    /** Units that could not be sourced from any known channel (no insta price available). */
    unmet: number
    totalCount: number
    totalCost: number
}

/**
 * Works out how a given total amount of an ingredient would realistically be acquired on the bazaar,
 * cheapest channel first: npc stock, then either a competitive buy order ('order' mode) or straight to
 * insta-buying sell offers ('insta' mode). The unit prices/capacities come from the backend and are
 * quantity independent, so this can be recomputed for any tree-multiplied total. Returns null when there
 * is no market data at all. Costs are estimates - the insta portion in particular assumes the sell book
 * stays near its current marginal price rather than walking deeper as it is consumed.
 */
export function getAcquisitionPlan(
    ingredient: {
        npcCapacity?: number | null
        npcUnitPrice?: number | null
        buyOrderCapacity?: number | null
        buyOrderUnitPrice?: number | null
        instaBuyUnitPrice?: number | null
    },
    totalCount: number,
    mode: AcquisitionMode = 'order'
): AcquisitionPlan | null {
    const npcCap = Math.max(0, ingredient.npcCapacity ?? 0)
    const npcUnit = ingredient.npcUnitPrice ?? 0
    const orderCap = Math.max(0, ingredient.buyOrderCapacity ?? 0)
    const orderUnit = ingredient.buyOrderUnitPrice ?? 0
    const instaUnit = ingredient.instaBuyUnitPrice ?? 0
    if (npcCap <= 0 && orderCap <= 0 && instaUnit <= 0) {
        return null // no market data
    }

    const total = Math.max(0, Math.round(totalCount))
    let remaining = total

    const npcQty = Math.min(remaining, npcCap)
    remaining -= npcQty

    // In 'order' mode we patiently buy-order the middle bucket; in 'insta' mode we skip it and take
    // everything beyond npc stock straight from the sell offers.
    const orderQty = mode === 'order' ? Math.min(remaining, orderCap) : 0
    remaining -= orderQty

    const instaQty = instaUnit > 0 ? remaining : 0
    remaining -= instaQty

    const npc: AcquisitionBucket = { qty: npcQty, unitPrice: npcUnit, cost: npcQty * npcUnit }
    const order: AcquisitionBucket = { qty: orderQty, unitPrice: orderUnit, cost: orderQty * orderUnit }
    const insta: AcquisitionBucket = { qty: instaQty, unitPrice: instaUnit, cost: instaQty * instaUnit }

    return {
        mode,
        npc,
        order,
        insta,
        unmet: remaining, // >0 only when there is no insta price to cover the tail
        totalCount: total,
        totalCost: npc.cost + order.cost + insta.cost
    }
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
    let multMap = [
        { mult: 1e12, suffix: 'T' },
        { mult: 1e9, suffix: 'B' },
        { mult: 1e6, suffix: 'M' },
        { mult: 1e3, suffix: 'k' },
        { mult: 1, suffix: '' }
    ]
    let multIndex = multMap.findIndex(m => num >= m.mult)
    if (multIndex === -1) {
        multIndex = multMap.length - 1
    }
    if (multIndex !== 0) {
        if (Math.round(num / multMap[multIndex].mult) === 1000) {
            multIndex -= 1
        }
    }

    let mult = multMap[multIndex]
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
    ].find(val => shortString.includes(val.suffix)) || { value: 1, suffix: '' }
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
export function formatDungeonStarsInString(stringWithStars: string = '', style: CSSProperties = {}, dungeonItemLevelString?: string): JSX.Element {
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

export function getMinecraftColorCodedElement(text: string = '', autoFormat = true): JSX.Element {
    let styleMap: { [key: string]: React.CSSProperties } = {
        '0': { color: '#000000' },
        '1': { color: '#0000aa' },
        '2': { color: '#00aa00' },
        '3': { color: '#00aaaa' },
        '4': { color: '#aa0000' },
        '5': { color: '#aa00aa' },
        '6': { color: '#ffaa00' },
        '7': { color: '#aaaaaa' },
        '8': { color: '#555555' },
        '9': { color: '#5555ff' },
        a: { color: '#55ff55' },
        b: { color: '#55ffff' },
        c: { color: '#FF5555' },
        d: { color: '#FF55FF' },
        e: { color: '#FFFF55' },
        f: { color: '#FFFFFF' },
        l: { fontWeight: 'bold' },
        n: { textDecorationLine: 'underline', textDecorationSkip: 'spaces' },
        o: { fontStyle: 'italic' },
        m: { textDecoration: 'line-through', textDecorationSkip: 'spaces' },
        r: { textDecoration: 'none', textDecorationLine: 'none', textDecorationSkip: 'none', fontWeight: 'normal', fontStyle: 'normal', color: '#FFFFFF' }
    }

    let splits = text.split('§')
    let elements: JSX.Element[] = []
    let currentStyle = {}

    splits.forEach((split, i) => {
        if (i === 0) {
            if (split !== '') {
                elements.push(<span key={i}>{split}</span>)
            }
            return
        }
        let code = split.substring(0, 1)
        let text = autoFormat ? convertTagToName(split.substring(1, split.length)) : split.substring(1, split.length)

        // get new style. Use reset if a unknown color code is used
        let newStyle = styleMap[code] || styleMap['r']

        currentStyle = { ...currentStyle, ...newStyle }
        elements.push(
            <span key={i} style={currentStyle}>
                {text}
            </span>
        )
    })

    function textContent(elem: React.ReactElement<any> | string): string {
        if (!elem) {
            return ''
        }
        if (typeof elem === 'string') {
            return elem
        }
        const children = elem.props && elem.props.children
        if (children instanceof Array) {
            return children.map(textContent).join('')
        }
        return textContent(children)
    }

    function addBreaks(elements: JSX.Element[]) {
        const updatedElements = elements.map(element => {
            if (element.type === 'span' && element.props.children) {
                let text = textContent(element)
                if (text.includes('\n')) {
                    const parts = text.split('\n')
                    return cloneElement(
                        element,
                        element.props,
                        <>
                            <span>{parts[0]}</span>
                            <br />
                            <span>{parts[1]}</span>
                        </>
                    )
                }
            }
            return element
        })
        return updatedElements
    }

    elements = addBreaks(elements)

    return <span>{elements}</span>
}

export function removeMinecraftColorCoding(text: string = ''): string {
    return text.replace(/§[0-9a-fk-or]/gi, '')
}
