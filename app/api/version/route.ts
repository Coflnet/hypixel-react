export const dynamic = 'force-dynamic'

const internalHost = 'hypixel-react.sky.svc.cluster.local'

export function GET(request: Request) {
    const host = request.headers.get('host')?.split(':')[0]
    if (host !== internalHost) return new Response(null, { status: 404 })

    const version = process.env.APP_VERSION ?? ''
    if (!/^[a-f0-9]{40}$/i.test(version)) return new Response('APP_VERSION is not configured', { status: 503 })

    return new Response(version, {
        headers: {
            'Cache-Control': 'no-store',
            'Content-Type': 'text/plain; charset=utf-8'
        }
    })
}
