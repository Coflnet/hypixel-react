import { Metadata } from "next";
import Link from "next/link";
import { Card, CardBody, CardTitle, CardText, Col, Container, Row } from "react-bootstrap";
import { getHeadMetadata } from "../../../utils/SSRUtils";

export const metadata: Metadata = getHeadMetadata(
    "How to Make Money with Bazaar Flipping | Flipping Guides",
    "Learn how to make money with Bazaar flipping in Hypixel Skyblock with these effective strategies."
);

export default function HowToMakeMoneyWithBazaarFlippingPage() {
    return (
        <Container>
            <Row>
                <Col>
                    <Card>
                        <CardBody>
                            <CardTitle as="h2">How to Make Money with Bazaar Flipping</CardTitle>
                            <CardText>
                                Bazaar flipping is a reliable way to make money in Hypixel Skyblock. Here are some strategies to maximize your profits.
                            </CardText>
                            <CardTitle as="h3">1. Master Buy and Sell Orders</CardTitle>
                            <CardText>
                                The key to profitable bazaar flipping is to avoid instant buying and selling. Instead, you should always use buy orders to purchase items and sell offers to sell them. This allows you to buy for less and sell for more, maximizing your profit margin.
                            </CardText>
                            <CardTitle as="h3">2. Focus on High-Volume Items</CardTitle>
                            <CardText>
                                While high-margin items are tempting, high-volume items often lead to more consistent profits. Items that are traded frequently, like farming materials or common slayer drops, allow you to complete your flips quickly and reinvest your capital.
                            </CardText>
                            <CardTitle as="h3">3. Use Flipping Tools</CardTitle>
                            <CardText>
                                Manually searching for good flips is time-consuming and inefficient. Use our <Link href="/bazaar">Bazaar Flips</Link> page to instantly see a list of the most profitable items to flip, sorted by potential profit. For even better results, try our <Link href="/premiumBazaar">Premium Bazaar Flips</Link> which shows demand-based spreads for advanced flippers.
                            </CardText>
                            <CardText>
                                If you use the SkyCofl Mod, you can also use the <strong>/cofl bazaar</strong> command in-game to see the top Bazaar flips directly in Minecraft. This command shows profit per hour, fees, and volumes, with clickable shortcuts to open the Bazaar instantly. Learn more in our <Link href="/wiki/docs/mod-commands#bazaarcommand-alias-bz">mod commands reference</Link>.
                            </CardText>
                            <CardTitle as="h3">4. Understand Market Dynamics</CardTitle>
                            <CardText>
                                Pay attention to game updates and events. A new update might increase the demand for certain items, creating profitable flipping opportunities. For example, if a new pet is released that requires a specific material to craft, the price of that material will likely go up.
                            </CardText>
                            <CardTitle as="h3">5. Reinvest Your Profits</CardTitle>
                            <CardText>
                                As you make money, reinvest it into your flipping operation. This will allow you to flip more expensive items and larger quantities, which can lead to even greater profits.
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
