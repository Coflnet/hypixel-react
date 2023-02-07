import Head from 'next/head'

export function isClientSideRendering() {
    return typeof window !== 'undefined'
}

export function getSSRElement(obj: any): JSX.Element {
    return (
        <ul>
            {Object.keys(obj).map(key => {
                if (!obj[key]) {
                    return null
                }
                if (key === 'iconUrl') {
                    return <img src={obj[key]} />
                }
                if (typeof obj[key] === 'object') {
                    return getSSRElement(obj[key])
                }
                return <li>{`${key}: ${obj[key].toString()}`}</li>
            })}
        </ul>
    )
}

export function getHeadElement(
    title: string = 'Skyblock Auction House History | Hypixel SkyBlock AH history',
    description: string = 'Browse over 500 million auctions, and the bazaar of Hypixel SkyBlock.',
    imageUrl: string = 'https://sky.coflnet.com/logo192.png',
    keywords: string[] = [],
    embedTitle: string = 'Skyblock Auction House History | Hypixel SkyBlock AH history'
) {
    return (
        <Head key="indexHead">
            <link rel="manifest" href="/manifest.json" />
            <link rel="icon" href="/favicon.ico" />
            <link rel="apple-touch-icon" href="/logo192.png" />
            <title>{title}</title>
            <meta charSet="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <meta name="theme-color" content="#000000" />
            <meta name="og:title" content={embedTitle} />
            <meta name="description" content={description} />
            <meta name="og:description" content={description} />
            <meta name="keywords" content={`${keywords.toString()},hypixel,skyblock,auction,history,bazaar,tracker`} />
            <meta property="og:keywords" content={`${keywords.toString()},hypixel,skyblock,auction,history,bazaar,tracker`} />
            <meta property="og:image" content={imageUrl} />
            <meta
                httpEquiv="origin-trial"
                content="AiID47XFUe5A23XpsQ09uZGmLNbzoXyVeFRskSRUJ3Bk030Fau5WH1MF941KwfH+RLTVYzrcssvGIYPuOi/kkwQAAABkeyJvcmlnaW4iOiJodHRwczovL2NvZmxuZXQuY29tOjQ0MyIsImZlYXR1cmUiOiJEaWdpdGFsR29vZHMiLCJleHBpcnkiOjE2Mzk1MjYzOTksImlzU3ViZG9tYWluIjp0cnVlfQ=="
            ></meta>
        </Head>
    )
}
