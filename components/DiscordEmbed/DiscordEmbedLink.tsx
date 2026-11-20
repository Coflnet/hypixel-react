import { headers } from 'next/headers'
import { DISCORD_EMBED_REL } from '../../utils/DiscordComponentEmbed'
import { getDiscordEmbedHref, getDiscordEmbedOrigin } from '../../utils/DiscordEmbedLink'

interface Props {
    /** the page path, e.g. ['player', uuid] */
    segments: string[]
    search?: string
}

/**
 * Links the page's Discord component embed (served by app/discord-embed). React hoists the <link> into <head>,
 * where Discord looks for it in the server rendered HTML. The og:/twitter: meta tags stay as the fallback.
 */
export async function DiscordEmbedLink({ segments, search }: Props) {
    const requestHeaders = await headers()
    const host = requestHeaders.get('host') || requestHeaders.get('x-forwarded-host')
    const origin = getDiscordEmbedOrigin(host, process.env.NODE_ENV !== 'production')
    return <link rel={DISCORD_EMBED_REL} type="application/json" href={getDiscordEmbedHref(origin, segments, search)} />
}
