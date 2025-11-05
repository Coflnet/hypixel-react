import { Metadata } from "next";
import Link from "next/link";
import { Card, CardBody, CardTitle, CardText, Col, Container, Row } from "react-bootstrap";
import { getHeadMetadata } from "../../../utils/SSRUtils";

export const metadata: Metadata = getHeadMetadata(
    "How to Avoid Scams While Flipping | Flipping Guides",
    "Learn how to protect yourself from common scams while flipping in Hypixel Skyblock."
);

export default function HowToAvoidScamsPage() {
    return (
        <Container>
            <Row>
                <Col>
                    <Card>
                        <CardBody>
                            <CardTitle as="h2">How to Avoid Scams While Flipping</CardTitle>
                            <CardText>
                                Flipping can be very profitable, but it's also a target for scammers. Here are some tips to help you stay safe and protect your hard-earned coins.
                            </CardText>
                            <CardTitle as="h3">1. Beware of Market Manipulation</CardTitle>
                            <CardText>
                                Scammers sometimes try to artificially inflate the price of an item to trick players into buying it at a high price.
                                This is often done with items that have low trading volume.
                            </CardText>
                            <CardText>
                                <strong>How to avoid it:</strong> Be suspicious of items with sudden, dramatic price spikes. Check the item's price history and trading volume before investing. Our premium tools can help you detect market manipulation.
                            </CardText>
                            <CardTitle as="h3">2. Double-Check Item Details</CardTitle>
                            <CardText>
                                In the Auction House, scammers may list items that look similar to valuable ones but are actually worthless. For example, they might list a regular item with a skin that makes it look like a rare one.
                            </CardText>
                            <CardText>
                                <strong>How to avoid it:</strong> Always carefully inspect the item's details, including its name, lore, and stats, before placing a bid.
                            </CardText>
                            <CardTitle as="h3">3. Use Reputable Trading Platforms</CardTitle>
                            <CardText>
                                Stick to the official Bazaar and Auction House for your trades. Avoid trading with players directly, as this is where most scams happen.
                            </CardText>
                            <CardTitle as="h3">4. If It Seems Too Good to Be True, It Probably Is</CardTitle>
                            <CardText>
                                Be skeptical of deals that seem unbelievably good. While it's possible to find great deals, extremely low prices can be a red flag for a scam.
                            </CardText>
                            <CardTitle as="h3">5. Secure Your Account</CardTitle>
                            <CardText>
                                The best way to protect your items and coins is to secure your Minecraft account. Use a strong, unique password and enable two-factor authentication (2FA) if possible.
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
