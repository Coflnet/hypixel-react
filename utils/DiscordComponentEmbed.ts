/*
 Discord component embeds (https://docs.discord.com/developers/link-previews/component-embeds): a page links
 Discord Components V2 JSON with <link rel="discord:component-embed"> in its <head>, and Discord shows it as the link
 embed instead of the OpenGraph card: markdown text, a thumbnail, dividers and link buttons, no bot needed.
 The og:/twitter: meta tags stay as the fallback for everything else.
 Only the component types used here are modelled. Everything is pure so it can be unit tested.
*/

export const DISCORD_EMBED_REL = 'discord:component-embed'

export const ComponentType = {
    ActionRow: 1,
    Button: 2,
    Section: 9,
    TextDisplay: 10,
    Thumbnail: 11,
    Separator: 14,
    Container: 17
} as const

const LINK_BUTTON_STYLE = 5
const SMALL_SPACING = 1

// Discord limits: 5 buttons per action row, 80 chars per button label, 512 chars per button URL, 2048 per media URL
export const MAX_BUTTONS = 5
export const MAX_BUTTON_LABEL_LENGTH = 80
export const MAX_URL_LENGTH = 512
export const MAX_MEDIA_URL_LENGTH = 2048
// Discord ignores payloads over 3,000 bytes (UTF-8 of the JSON, escapes at full length); some margin stays free
export const MAX_PAYLOAD_BYTES = 3000
export const PAYLOAD_BYTE_BUDGET = 2900

const ELLIPSIS = '…'
const ELLIPSIS_BYTES = 3
// room the text keeps (about a heading with its link); below it buttons are dropped instead
const MIN_BODY_BYTES = 200
const VARIATION_SELECTOR_16 = String.fromCodePoint(0xfe0f)

// --bs-success of the "darkly" theme, the green of the SkyCofl buttons and premium badges
export const BRAND_ACCENT_COLOR = 0x00bc8c

export const EMBED_FOOTER = '-# SkyCofl • sky.coflnet.com'

// Minecraft colour codes of the SkyBlock rarities; common/unknown items use the brand colour
const TIER_ACCENT_COLORS: Record<string, number> = {
    UNCOMMON: 0x55ff55,
    RARE: 0x5555ff,
    EPIC: 0xaa00aa,
    LEGENDARY: 0xffaa00,
    MYTHIC: 0xff55ff,
    DIVINE: 0x55ffff,
    SPECIAL: 0xff5555,
    VERY_SPECIAL: 0xff5555,
    ULTIMATE: 0xaa0000,
    SUPREME: 0xaa0000,
    ADMIN: 0xaa0000
}

export interface PartialEmoji {
    name: string
}

export interface TextDisplayComponent {
    type: typeof ComponentType.TextDisplay
    content: string
}

export interface ThumbnailComponent {
    type: typeof ComponentType.Thumbnail
    media: { url: string }
}

export interface SectionComponent {
    type: typeof ComponentType.Section
    components: TextDisplayComponent[]
    accessory: ThumbnailComponent
}

export interface SeparatorComponent {
    type: typeof ComponentType.Separator
    divider: boolean
    spacing: number
}

export interface LinkButtonComponent {
    type: typeof ComponentType.Button
    style: typeof LINK_BUTTON_STYLE
    label: string
    url: string
    emoji?: PartialEmoji
}

export interface ActionRowComponent {
    type: typeof ComponentType.ActionRow
    components: LinkButtonComponent[]
}

export type ContainerChild = TextDisplayComponent | SectionComponent | SeparatorComponent | ActionRowComponent

export interface ContainerComponent {
    type: typeof ComponentType.Container
    accent_color: number
    components: ContainerChild[]
}

export interface DiscordEmbedPayload {
    component: ContainerComponent
}

export interface EmbedButton {
    label: string
    /** buttons without a valid https URL are left out */
    url?: string | null
    /** a single Unicode emoji */
    emoji?: string
}

/** A falsy line is left out, so callers can write `value !== undefined && line(...)` */
export type EmbedLine = string | false | null | undefined

export interface ComponentEmbedContent {
    title: string
    /** the title links here */
    url: string
    lines: EmbedLine[]
    /** shown after the lines, but dropped first when the payload is over the byte budget */
    optionalLines?: EmbedLine[]
    thumbnailUrl?: string | null
    buttons?: EmbedButton[]
    accentColor?: number
}

const MARKDOWN_SPECIAL_CHARACTERS = /[\\*_~`|[\]<>]/g

/** Escapes Discord markdown so user and item names render literally (and cannot form links, mentions or emojis) */
export function escapeMarkdown(text: string): string {
    return text.replace(/\s+/g, ' ').replace(MARKDOWN_SPECIAL_CHARACTERS, character => `\\${character}`)
}

/** An emoji led stat line `📈 Profit: **+62M**`; undefined when there is no value to show */
export function statLine(emoji: string, label: string, value?: string | number | null): string | undefined {
    if (value === undefined || value === null || value === '') {
        return undefined
    }
    return `${emoji} ${label}: **${escapeMarkdown(String(value))}**`
}

export function getTierAccentColor(tier?: string | null): number {
    if (!tier || typeof tier !== 'string') {
        return BRAND_ACCENT_COLOR
    }
    return TIER_ACCENT_COLORS[tier.toUpperCase()] ?? BRAND_ACCENT_COLOR
}

function isHttpsUrl(url: string | null | undefined, maxLength: number): url is string {
    if (!url || url.length > maxLength) {
        return false
    }
    try {
        return new URL(url).protocol === 'https:'
    } catch {
        return false
    }
}

export function isValidEmbedUrl(url?: string | null): url is string {
    return isHttpsUrl(url, MAX_URL_LENGTH)
}

/** Cuts on code points (never inside a surrogate pair) and marks the cut with an ellipsis */
export function truncateCodePoints(text: string, maxCodePoints: number): string {
    const codePoints = Array.from(text)
    if (codePoints.length <= maxCodePoints) {
        return text
    }
    return codePoints.slice(0, Math.max(0, maxCodePoints - 1)).join('') + ELLIPSIS
}

export function getPayloadBytes(payload: DiscordEmbedPayload): number {
    return new TextEncoder().encode(JSON.stringify(payload)).length
}

// parentheses and spaces would end the markdown link early
function toMarkdownLinkUrl(url: string): string {
    return url.replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/ /g, '%20')
}

function getHeading(title: string, url: string): string {
    const text = escapeMarkdown(title)
    return isValidEmbedUrl(url) ? `### [${text}](${toMarkdownLinkUrl(url)})` : `### ${text}`
}

function presentLines(lines: EmbedLine[] = []): string[] {
    return lines.filter((line): line is string => !!line)
}

function getBodyText(content: ComponentEmbedContent, withOptionalLines: boolean): string {
    const optional = withOptionalLines ? presentLines(content.optionalLines) : []
    return [getHeading(content.title, content.url), ...presentLines(content.lines), ...optional].join('\n')
}

function textDisplay(content: string): TextDisplayComponent {
    return { type: ComponentType.TextDisplay, content }
}

// a section needs an accessory, so without a thumbnail the text stands alone
function getHeader(body: string, thumbnailUrl?: string | null): TextDisplayComponent | SectionComponent {
    const text = textDisplay(body)
    if (!isHttpsUrl(thumbnailUrl, MAX_MEDIA_URL_LENGTH)) {
        return text
    }
    return {
        type: ComponentType.Section,
        components: [text],
        accessory: { type: ComponentType.Thumbnail, media: { url: thumbnailUrl } }
    }
}

// emoji names without the emoji presentation selector, which some clients send and others do not
function toEmoji(emoji?: string): { emoji: PartialEmoji } | undefined {
    const name = emoji?.split(VARIATION_SELECTOR_16).join('').trim()
    return name ? { emoji: { name } } : undefined
}

function toLinkButton(button: EmbedButton & { url: string }): LinkButtonComponent {
    return {
        type: ComponentType.Button,
        style: LINK_BUTTON_STYLE,
        label: truncateCodePoints(button.label.trim(), MAX_BUTTON_LABEL_LENGTH),
        url: button.url,
        ...toEmoji(button.emoji)
    }
}

/** Valid link buttons, without duplicate URLs, at most the 5 an action row can hold */
export function getLinkButtons(buttons: EmbedButton[] = []): LinkButtonComponent[] {
    const seenUrls = new Set<string>()
    const valid = buttons.filter((button): button is EmbedButton & { url: string } => {
        if (!button.label?.trim() || !isValidEmbedUrl(button.url) || seenUrls.has(button.url)) {
            return false
        }
        seenUrls.add(button.url)
        return true
    })
    return valid.slice(0, MAX_BUTTONS).map(toLinkButton)
}

function getButtonRow(buttons: LinkButtonComponent[]): ActionRowComponent[] {
    return buttons.length > 0 ? [{ type: ComponentType.ActionRow, components: buttons }] : []
}

function assemble(content: ComponentEmbedContent, body: string, buttons: LinkButtonComponent[]): DiscordEmbedPayload {
    return {
        component: {
            type: ComponentType.Container,
            accent_color: content.accentColor ?? BRAND_ACCENT_COLOR,
            components: [
                getHeader(body, content.thumbnailUrl),
                { type: ComponentType.Separator, divider: true, spacing: SMALL_SPACING },
                ...getButtonRow(buttons),
                textDisplay(EMBED_FOOTER)
            ]
        }
    }
}

function fitsBudget(payload: DiscordEmbedPayload): boolean {
    return getPayloadBytes(payload) <= PAYLOAD_BYTE_BUDGET
}

// bytes of the text inside a JSON string; JSON escapes each character on its own, so the costs add up
function jsonStringBytes(text: string): number {
    return new TextEncoder().encode(JSON.stringify(text)).length - 2
}

/** The text cut on code points to at most maxBytes as part of the JSON, an ellipsis marking the cut */
export function cutToJsonBytes(text: string, maxBytes: number): string {
    if (jsonStringBytes(text) <= maxBytes) {
        return text
    }
    let used = ELLIPSIS_BYTES
    const kept: string[] = []
    for (const codePoint of text) {
        used += jsonStringBytes(codePoint)
        if (used > maxBytes) {
            break
        }
        kept.push(codePoint)
    }
    return kept.join('') + ELLIPSIS
}

// the text gets what the rest of the payload leaves; buttons are dropped only when even the heading would not fit
function shrinkToBudget(content: ComponentEmbedContent, body: string, buttons: LinkButtonComponent[]): DiscordEmbedPayload {
    const allowance = PAYLOAD_BYTE_BUDGET - getPayloadBytes(assemble(content, '', buttons))
    if (allowance >= MIN_BODY_BYTES || buttons.length === 0) {
        return assemble(content, cutToJsonBytes(body, Math.max(allowance, 0)), buttons)
    }
    return shrinkToBudget(content, body, buttons.slice(0, -1))
}

/** The embed payload, at most PAYLOAD_BYTE_BUDGET bytes: optional lines go first, then the text is cut */
export function buildComponentEmbed(content: ComponentEmbedContent): DiscordEmbedPayload {
    const buttons = getLinkButtons(content.buttons)
    const full = assemble(content, getBodyText(content, true), buttons)
    if (fitsBudget(full)) {
        return full
    }
    const required = getBodyText(content, false)
    const withoutOptional = assemble(content, required, buttons)
    return fitsBudget(withoutOptional) ? withoutOptional : shrinkToBudget(content, required, buttons)
}
