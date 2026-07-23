export const dynamic = 'force-dynamic'

export function GET() {
    return new Response(process.env.APP_VERSION ?? '', {
        headers: {
            'Cache-Control': 'no-store',
            'Content-Type': 'text/plain; charset=utf-8'
        }
    })
}
