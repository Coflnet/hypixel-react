import { parseBMName } from '../utils/Parser/ParseBMConfig'

const tests = [
    'ASPECT_OF_THE_DRAGON=rarity_upgraded:true&stars:10&ultimate_combo:4',
    'ASPECT_OF_THE_DRAGON=rarity_upgraded:true&stars:10&ultimate_one_for_all',
    'ABICASE=global:true',
    'JUJU_SHORTBOW=overload:1&power:7&rarity_upgraded:true&stars:10&ultimate_duplex:1',
    'PET_ENDER_DRAGON_LEGENDARY=candyUsed:true&rounded_level:100',
    'PET_GOLDEN_DRAGON_LEGENDARY=candyUsed:true&heldItem:MINOS_RELIC&rounded_level:200',
    'RANCHERS_BOOTS=mossy:true',
    'MIDAS_STAFF=stars:5&ultimate_wise:5&winning_bid_value:medium',
    'MIDAS_SWORD=stars:5&winning_bid_value:high',
    'AURORA_HELMET=arachno_resistance:1&mana_pool:1'
]

const output: any[] = []

for (const test of tests) {
    output.push(parseBMName(test))
}

console.log(output)
