import type { NextApiResponse } from 'next'
import LRU from 'lru-cache'
import { NextResponse } from 'next/server'

type Options = {
    uniqueTokenPerInterval?: number
    interval?: number
}

export default function rateLimit(options?: Options) {
    const tokenCache = new LRU({
        max: options?.uniqueTokenPerInterval || 500,
        ttl: options?.interval || 60000
    })

    return {
        check: (limit: number, token: string) =>
            new Promise<void>((resolve, reject) => {
                const tokenCount = (tokenCache.get(token) as number[]) || [0]
                if (tokenCount[0] === 0) {
                    tokenCache.set(token, tokenCount)
                }
                tokenCount[0] += 1

                console.log('TokenCount: ' + tokenCount)

                const currentUsage = tokenCount[0]
                const isRateLimited = currentUsage >= limit
                return isRateLimited ? reject() : resolve()
            })
    }
}
