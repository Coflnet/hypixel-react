'use client'

import Link from 'next/link'
import { Container, Card, Row, Col } from 'react-bootstrap'
import { Pets, Build, Storefront, Agriculture, ShowChart, Handyman, Help, JoinFull, Volcano, QuestionMark } from '@mui/icons-material'
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
        description: <span>Composter Flips let you profit from the Garden update by converting crops and resources in the composter. Its part of the profitable task system of our mod, run <code>/cofl task</code> to access it.</span>,
        icon: <Agriculture fontSize="large" />
    },
    {
        name: 'Bazaar Flips',
        path: '/bazaar',
        description: <span>Bazaar flips with anit market manipulation, shows you to the items to buy order and flip to sell order accounts for average insta sells and insta buys. Run <code>/cofl bazaar</code> with our mod to access</span>,
        icon: <ShowChart fontSize="large" />
    },
    {
        name: 'Forge Flips',
        path: undefined,
        description: <span>Forge Flips focus on the Dwarven Mines and Crystal Hollows. Upgrade and forge items for profit, track cooldowns, and discover the most valuable forge recipes. Run <code>/cofl forge</code> with our mod to access</span>,
        icon: <Volcano fontSize="large" />
    },
    {
        name: 'NPC Flips',
        path: '/npc',
        description: 'Buy items from NPCs and sell them on the Auction House or Bazaar for profit. Find out which items offer the best margins.',
        icon: <Storefront fontSize="large" />
    },
    {
        name: 'Attribute Fusion Machine Flips',
        path: undefined,
        description: <span>Use the Attribute Fusion Machine on galatea to combine two shards that you got from a buy order and create a sell order for the resulting shard. This flip is currently only available via <code>/cofl fusionflip</code> using our mod</span>,
        icon: <JoinFull fontSize="large" />
    },
    {
        name: 'Item Upgrade Flips',
        path: undefined,
        description: <span>Use the the hex or just manually apply enchantments, Hot potato books etc to an item to make it worth more than it costs. Available via <code>/cofl attributeflip</code> using our mod</span>,
        icon: <Handyman fontSize="large" />
    },
    {
        name: 'Ananke Feather Flips',
        path: undefined,
        description: <span>Find the best items to use Ananke Feather on in RNG-Meters. Shows you the most profitable item to target, how much it costs and how much profit is to be made. Available via <code>/cofl ananke</code> using our mod</span>,
        icon: <Handyman fontSize="large" />
    },
    {
        name: 'suggest new',
        path: 'https://discord.gg/wvKXfTgCfb',
        description: 'We are always looking to expand our flipping hub. If you have a new flip type that you think should be included, please suggest it on our Discord server.',
        icon: <QuestionMark fontSize="large" />
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
                                    <span>{flip.name}</span>
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
                            <Card.Link as={Link} href={flip.path ?? '/mod'}>
                                <button className="btn btn-primary">
                                    Go to {flip.name}
                                </button>
                            </Card.Link>
                        </Card.Body>
                    </Card>
                </Col>
            ))}
        </Row>
    )
}
