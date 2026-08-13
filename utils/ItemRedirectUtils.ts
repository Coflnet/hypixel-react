interface CustomItemRedirect {
    itemTag: string
    filters: Record<string, string>
}

const HAT_COLORS = ['BLACK', 'YELLOW', 'GREEN', 'ORANGE', 'LIME', 'RED', 'PINK', 'AQUA', 'PURPLE']
const HAT_EMOJIS = ['TEARS', 'REGULAR', 'GRUMPY', 'CHEEKY', 'HAPPY', 'CUTE', 'FLUSHED', 'SHOCK', 'COOL', 'DERP']

// Firmament splits these items into custom IDs using their NBT variant. Keep all external
// ID compatibility redirects together so another known normalization can be added here.
const CUSTOM_ITEM_ID_REDIRECTS: Record<string, CustomItemRedirect> = Object.fromEntries([
    ...HAT_COLORS.flatMap(color => [
        [`PARTY_HAT_CRAB_${color}`, { itemTag: 'PARTY_HAT_CRAB', filters: { CrabHatColor: color.toLowerCase() } }],
        [`PARTY_HAT_CRAB_${color}_ANIMATED`, { itemTag: 'PARTY_HAT_CRAB_ANIMATED', filters: { CrabHatColor: color.toLowerCase() } }],
        [`BALLOON_HAT_2024_${color}`, { itemTag: 'BALLOON_HAT_2024', filters: { CrabHatColor: color.toLowerCase() } }]
    ]),
    ...HAT_EMOJIS.map(emoji => [`PARTY_HAT_SLOTH_${emoji}`, { itemTag: 'PARTY_HAT_SLOTH', filters: { PartyHatEmoji: emoji.toLowerCase() } }])
] as [string, CustomItemRedirect][])

export function getCustomItemRedirectPath(itemTag: string, searchParams: Record<string, string | string[] | undefined>): string | null {
    const itemRedirect = CUSTOM_ITEM_ID_REDIRECTS[itemTag]
    if (!itemRedirect) return null

    const redirectParams = new URLSearchParams()
    Object.entries(searchParams).forEach(([key, value]) => {
        const values = Array.isArray(value) ? value : [value]
        values.forEach(entry => {
            if (entry !== undefined) redirectParams.append(key, entry)
        })
    })
    Object.entries(itemRedirect.filters).forEach(([key, value]) => redirectParams.set(key, value))

    return `/item/${itemRedirect.itemTag}?${redirectParams.toString()}`
}
