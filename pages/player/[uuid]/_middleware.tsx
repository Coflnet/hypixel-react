import { NextFetchEvent, NextRequest, NextResponse } from 'next/server'
import api from '../../../api/ApiHelper'

export async function middleware(req: NextRequest, ev: NextFetchEvent) {
    if (req.nextUrl.pathname.startsWith('/player')) {
        const url = req.nextUrl.clone()
        let split = url.pathname.split('/')
        if (split[2].length < 30) {
            await api.playerSearch(split[2]).then(players => {
                console.log("promise finished")
                split[2] = players[0].uuid
            })
            console.log(split.join('/'))
            url.pathname = split.join('/')
            return NextResponse.redirect(url)
        }
    }
    return NextResponse.next()
}
