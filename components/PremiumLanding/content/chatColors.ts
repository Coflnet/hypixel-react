// Minecraft's own chat color values, so the "Chat color" rows show the colors players see in game.

const MINECRAFT_CHAT_COLORS: Record<string, string> = {
    Gray: '#AAAAAA',
    White: '#FFFFFF',
    Green: '#55FF55',
    Gold: '#FFAA00'
}

/** the CSS color of a Minecraft chat color name, or undefined for any other text */
export function getChatColor(name: string): string | undefined {
    return MINECRAFT_CHAT_COLORS[name]
}
