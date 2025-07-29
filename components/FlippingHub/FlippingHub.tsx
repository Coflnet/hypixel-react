'use client'

import Link from 'next/link'
import { Container, Card, Row, Col } from 'react-bootstrap'
import { Pets, Build, Storefront, Agriculture, ShowChart, AutoFixHigh, Help, JoinFull } from '@mui/icons-material'
import Tooltip from '../Tooltip/Tooltip'

const flipKinds = [
    {
        name: 'Kat Flips',
        path: '/kat',
        description: 'Kat Flips are profitable pet upgrades using the NPC "Kat". Discover which pets can be upgraded for profit and maximize your coins with detailed analysis and real-time data.',
        icon: <Pets fontSize="large" />
    },
    {
        name: 'Craft Flips',
        path: '/crafts',
        description: 'Craft Flips involve buying materials and crafting items to sell for profit. Find the best recipes, track material prices, and optimize your crafting strategy for maximum returns.',
        icon: <Build fontSize="large" />
    },
    {
        name: 'AH Flipper',
        path: '/flipper',
        description: 'Auction House Flips (AH Flipper) help you buy low and sell high on the Hypixel SkyBlock Auction House. Analyze trends, snipe deals, and boost your profits with advanced flipping tools.',
        icon: <Storefront fontSize="large" />
    },
    {
        name: 'Composter Flips',
        path: undefined,
        description: 'Composter Flips let you profit from the Garden update by converting crops and resources in the composter. Track the most lucrative composting strategies and maximize your garden income.',
        icon: <Agriculture fontSize="large" />
    },
    {
        name: 'Bazaar Flips',
        path: undefined,
        description: 'Bazaar Flips are all about trading items on the Hypixel Bazaar for profit. Monitor market trends, find arbitrage opportunities, and learn the best flipping tactics for every item.',
        icon: <ShowChart fontSize="large" />
    },
    {
        name: 'Forge Flips',
        path: undefined,
        description: 'Forge Flips focus on the Dwarven Mines and Crystal Hollows. Upgrade and forge items for profit, track cooldowns, and discover the most valuable forge recipes.',
        icon: <AutoFixHigh fontSize="large" />
    },
    {
        name: 'Attribute Fusion Machine Flips',
        path: undefined,
        description: 'Use the Attribute Fusion Machine on galatea to combine two shards that you got from a buy order and create a sell order for the resulting shard. This flip is currently only available via `/cofl fusionflip` using our mod',
        icon: <JoinFull fontSize="large" />
    }
]

export default function FlippingHub() {
    return (
        <Row>
            {flipKinds.map(flip => (
                <Col md={6} lg={4} key={flip.name} className="mb-4">
                    <Card>
                        <Card.Header className="d-flex align-items-center gap-2">
                            {flip.icon}
                            <Card.Title className="mb-0">
                                {flip.path ? (
                                    <Link href={flip.path}>{flip.name}</Link>
                                ) : (
                                    <div className="d-flex align-items-center">
                                        <span>{flip.name}</span>
                                        <Tooltip
                                            type="hover"
                                            hoverPlacement="top"
                                            content={
                                                <Link href="/mod" className="ms-2">
                                                    <Help fontSize="small" />
                                                </Link>
                                            }
                                            tooltipContent={
                                                <span>
                                                    This feature is only available in-game and requires the use of our
                                                    Hypixel SkyBlock mod, its available on github, curseforge and modrinth.
                                                    Click to learn more.
                                                </span>
                                            }
                                        />
                                    </div>
                                )}
                            </Card.Title>
                        </Card.Header>
                        <Card.Body>
                            <Card.Text>{flip.description}</Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
            ))}
        </Row>
    )
}
