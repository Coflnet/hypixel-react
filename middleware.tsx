import { NextFetchEvent, NextRequest, NextResponse } from 'next/server'
import api from './api/ApiHelper'

export async function middleware(req: NextRequest, ev: NextFetchEvent) {
    if (req.nextUrl.pathname.startsWith('/player')) {
        const url = req.nextUrl.clone()
        let split = url.pathname.split('/')

        // special case for people searching hyauctions
        if (split[2] === 'be7002531956406d81c535a81fe2833a') {
            url.pathname = '/'
            return NextResponse.redirect(url)
        }

        if (split[2].length < 30) {
            await api
                .playerSearch(split[2])
                .then(players => {
                    split[2] = players[0].uuid
                })
                .catch(() => {
                    split[2] = ''
                })
            url.pathname = split.join('/')
            return NextResponse.redirect(url)
        }
    }
    return NextResponse.next()
}
