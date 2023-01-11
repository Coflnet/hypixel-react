import { NextFetchEvent, NextRequest, NextResponse } from 'next/server'
import rateLimit from '../utils/RateLimitUtils'
import requestIp from 'request-ip'

const limiter = rateLimit({
    interval: 60 * 1000, // 60 seconds
    uniqueTokenPerInterval: 500 // Max 500 users per second
})

export async function middleware(req: NextRequest, ev: NextFetchEvent) {
    try {
        const clientIp = requestIp.getClientIp(req)
        console.log('------------------')
        console.log(clientIp)
        await limiter.check(100, clientIp) // 200 requests per minute
        return NextResponse.next()
    } catch {
        return new NextResponse('Rate limit exceeded', {
            status: 429
        })
    }
}
