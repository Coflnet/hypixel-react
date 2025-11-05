import { Metadata } from "next";
import Link from "next/link";
import { Card, CardBody, CardTitle, CardText, Col, Container, Row } from "react-bootstrap";
import { getHeadMetadata } from "../../../utils/SSRUtils";

export const metadata: Metadata = getHeadMetadata(
    "How to Flip on Hypixel Skyblock | Flipping Guides",
    "A comprehensive guide on how to flip on Hypixel Skyblock. Learn the basics of flipping on the Bazaar and Auction House."
);

export default function HowToFlipPage() {
    return (
        <Container>
            <Row>
                <Col>
                    <Card>
                        <CardBody>
                            <CardTitle as="h2">How to Flip on Hypixel Skyblock</CardTitle>
                            <CardText>
                                Flipping is one of the most popular and effective ways to make money in Hypixel Skyblock. It involves buying items for a low price and selling them for a higher price. This guide will walk you through the basics of flipping on both the Bazaar and the Auction House.
                            </CardText>
                            <CardTitle as="h3">Flipping on the Bazaar</CardTitle>
                            <CardText>
                                The Bazaar is the best place for beginners to start flipping. It's a commodity market, meaning you trade large quantities of identical items.
                            </CardText>
                            <ol>
                                <li><strong>Find a good item to flip:</strong> Use our <Link href="/bazaar">Bazaar Flips</Link> page to find items with a good profit margin and high trade volume.</li>
                                <li><strong>Create a buy order:</strong> Instead of instantly buying the item, create a buy order for a slightly higher price than the top existing buy order. This will ensure your order gets filled quickly while still getting a good price.</li>
                                <li><strong>Wait for your order to fill:</strong> Depending on the item and the time of day, this could take anywhere from a few minutes to a few hours.</li>
                                <li><strong>Create a sell offer:</strong> Once you have the items, create a sell offer for a slightly lower price than the top existing sell offer.</li>
                                <li><strong>Collect your profit:</strong> Once your items sell, you can collect your coins! The difference between your buy price and sell price (minus the Bazaar's 1.25% tax) is your profit.</li>
                            </ol>
                            <CardTitle as="h3">Flipping on the Auction House</CardTitle>
                            <CardText>
                                The Auction House (AH) is for flipping unique items like weapons, armor, and pets. It's more complex than the Bazaar but can be much more profitable.
                            </CardText>
                            <ol>
                                <li><strong>Find an undervalued item:</strong> Use our <Link href="/flipper">AH Flipper</Link> to find auctions that are ending soon and are priced below the item's average market value.</li>
                                <li><strong>Win the auction:</strong> Place a bid on the item and try to win it for a low price. This is often called "auction sniping."</li>
                                <li><strong>Relist the item:</strong> Once you have the item, list it back on the Auction House for a higher price. Make sure to set a price that is competitive with other similar items.</li>
                                <li><strong>Wait for it to sell:</strong> This can take some time, depending on the item and the price you've set.</li>
                            </ol>
                            <CardText>
                                For more detailed strategies, check out our other guides, such as <Link href="/guides/bazaar-vs-auction-house">Bazaar vs. Auction House Flipping</Link> and <Link href="/guides/best-flipping-strategy">What is the Best Flipping Strategy?</Link>.
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
