import { Metadata } from "next";
import Link from "next/link";
import { Card, CardBody, CardTitle, CardText, Col, Container, Row } from "react-bootstrap";
import { getHeadMetadata } from "../../../utils/SSRUtils";

export const metadata: Metadata = getHeadMetadata(
    "Bazaar vs. Auction House Flipping | Flipping Guides",
    "Understand the key differences between flipping on the Bazaar and the Auction House in Hypixel Skyblock."
);

export default function BazaarVsAuctionHousePage() {
    return (
        <Container>
            <Row>
                <Col>
                    <Card>
                        <CardBody>
                            <CardTitle as="h2">Bazaar vs. Auction House Flipping</CardTitle>
                            <CardText>
                                In Hypixel Skyblock, the Bazaar and the Auction House (AH) are the two main places to trade items. Both can be used for flipping, but they work very differently.
                            </CardText>
                            <CardTitle as="h3">The Bazaar</CardTitle>
                            <CardText>
                                The Bazaar is a commodity market. This means that all items of the same type are treated as identical. For example, one enchanted diamond is the same as any other enchanted diamond.
                            </CardText>
                            <ul>
                                <li><strong>High Volume:</strong> The Bazaar is great for flipping items that are traded in large quantities, like farming materials, enchanted books, and slayer drops.</li>
                                <li><strong>Instant Buy/Sell:</strong> You can instantly buy or sell items at the current market price, which makes for fast flips.</li>
                                <li><strong>Buy/Sell Orders:</strong> For higher profits, you can place buy orders to purchase items below the instant-buy price and sell offers to sell them above the instant-sell price.</li>
                                <li><strong>Price Fluctuation:</strong> Prices are determined by supply and demand and can fluctuate rapidly.</li>
                            </ul>
                            <CardTitle as="h3">The Auction House</CardTitle>
                            <CardText>
                                The Auction House is for unique items. Each item is listed individually, and its price is determined by what other players are willing to pay for that specific item. This includes things like:
                            </CardText>
                            <ul>
                                <li><strong>Weapons and Armor:</strong> These items can have different enchantments, reforges, and stats, making each one unique.</li>
                                <li><strong>Pets:</strong> Pets can have different levels and abilities.</li>
                                <li><strong>Rare Items:</strong> Items that can't be obtained in large quantities are often sold on the AH.</li>
                            </ul>
                            <CardTitle as="h3">Key Differences</CardTitle>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Feature</th>
                                        <th>Bazaar</th>
                                        <th>Auction House</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Item Type</td>
                                        <td>Commodities (stackable, identical items)</td>
                                        <td>Unique items (weapons, armor, pets)</td>
                                    </tr>
                                    <tr>
                                        <td>Trading Speed</td>
                                        <td>Fast (instant buy/sell)</td>
                                        <td>Slower (auctions have a duration)</td>
                                    </tr>
                                    <tr>
                                        <td>Profit Margins</td>
                                        <td>Generally smaller per item, but high volume can lead to large profits</td>
                                        <td>Can be very large for a single item, but requires more knowledge and capital</td>
                                    </tr>
                                    <tr>
                                        <td>Complexity</td>
                                        <td>Relatively simple to get started</td>
                                        <td>More complex, requires knowledge of item stats, enchantments, and reforges</td>
                                    </tr>
                                </tbody>
                            </table>
                            <CardTitle as="h3">Which One Should You Choose?</CardTitle>
                            <CardText>
                                For beginners, the Bazaar is a great place to start. It's easier to understand, and you can start making profits with a relatively small amount of capital. As you become more experienced and accumulate more coins, you can start exploring the Auction House for potentially larger profits.
                            </CardText>
                            <Link href="/guides" passHref>
                                Back to Guides
                            </Link>
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}
