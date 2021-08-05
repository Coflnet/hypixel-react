export const DEMO_FLIP: FlipAuction = {
    bin: true,
    cost: 7000000,
    item: {
        category: "MISC",
        name: "[Lvl 90] Ocelot",
        tag: "PET_OCELOT",
        tier: "LEGENDARY",
        iconUrl: "https://sky.coflnet.com/static/icon/PET_OCELOT"
    },
    lowestBin: 800000,
    median: 9800000,
    sellerName: "Testuser",
    showLink: true,
    uuid: "e4723502450544c8a3711a0a5b1e8cd0",
    volume: 5.874998615,
    sold: true,
    props: genProps()
}

function genProps(): string[] {
    let props: string[] = [];
    for (let i = 0; i < 30; i++) {
        props.push(i.toString())
    }
    return props;
}