import { Metadata } from "next";
import Link from "next/link";
import { Card, CardBody, CardTitle, CardText, Col, Container, Row } from "react-bootstrap";
import { getHeadMetadata } from "../../../utils/SSRUtils";

export const metadata: Metadata = getHeadMetadata(
    "Optimal Minion Setups for Passive Income | Hypixel Skyblock Guides",
    "Learn how to create the most optimal minion setups for passive income in Hypixel Skyblock. This guide covers the best minions, fuels, and layouts to maximize your earnings."
);

export default function OptimalMinionSetupsPage() {
    return (
        <Container>
            <Row>
                <Col>
                    <Card>
                        <CardBody>
                            <CardTitle as="h1">Optimal Minion Setups for Passive Income</CardTitle>
                            <CardText>
                                Minions are a core part of Hypixel Skyblock, providing a steady stream of passive income. A well-optimized minion setup can generate millions of coins per day with minimal effort. This guide will walk you through creating the best setup for your island.
                            </CardText>

                            <CardTitle as="h2" className="mt-4">Choosing the Right Minion</CardTitle>
                            <CardText>
                                The "best" minion changes frequently based on updates and the current market economy. Generally, the most profitable minions fall into a few categories:
                            </CardText>
                            <ul>
                                <li><strong>Farming Minions (Snow, Clay):</strong> These are often the most stable and profitable minions, especially when upgraded to tier 11. Snow minions with Diamond Spreading are a classic choice for reliable income.</li>
                                <li><strong>Mining Minions (Nether Quartz, Glowstone):</strong> These can be very profitable, but their output is often more volatile based on Bazaar prices.</li>
                                <li><strong>Foraging Minions (Acacia, Dark Oak):</strong> While less common, certain wood types can have high demand, making these minions a good niche choice.</li>
                                <li><strong>Slayer Minions (Revenant, Tarantula):</strong> These are an endgame choice, requiring significant investment but offering some of the highest potential profits through rare drops.</li>
                            </ul>
                            <CardText>
                                Use online calculators and our own website's Bazaar price tracking to see which minion is currently the most profitable.
                            </CardText>

                            <CardTitle as="h2" className="mt-4">The Best Minion Fuel</CardTitle>
                            <CardText>
                                Fuel is essential for boosting your minion's speed. The best choice depends on your budget and how often you can collect from your minions.
                            </CardText>
                            <ul>
                                <li><strong>Enchanted Lava Bucket:</strong> A one-time purchase that provides a permanent 25% speed boost. This is the most cost-effective option for long-term use.</li>
                                <li><strong>Catalysts:</strong> These provide a massive temporary boost but are consumed. They are best used when you can collect frequently to prevent the minion from becoming full.</li>
                                <li><strong>Foul Flesh / Hamster Wheels:</strong> Good budget options that provide a significant boost for a limited duration.</li>
                            </ul>

                            <CardTitle as="h2" className="mt-4">Essential Upgrades and Layout</CardTitle>
                            <ul>
                                <li><strong>Super Compactor 3000:</strong> Automatically compacts items into their enchanted form, saving space and increasing the value of each collection.</li>
                                <li><strong>Diamond Spreading:</strong> A minion upgrade that generates diamonds in addition to the minion's primary resource. It's a free, consistent source of extra income.</li>
                                <li><strong>Minion Expanders:</strong> Increases the minion's storage, allowing you to collect less frequently.</li>
                                <li><strong>Flycatchers:</strong> Provides a small boost to minion speed. While expensive, it's a key part of a fully maxed-out setup.</li>
                            </ul>
                            <CardText>
                                For layout, ensure your minions have enough space to operate and place storage chests nearby for easy collection.
                            </CardText>

                            <CardTitle as="h2" className="mt-4">Track Your Minion Profits Automatically</CardTitle>
                            <CardText>
                                Wondering how much your minions are *really* making? The <strong>SkyCofl Mod</strong> automatically tracks the items your minions produce. This allows you to see exactly how much passive income you're generating per hour or per day, taking all the guesswork out of optimizing your setup. You can easily compare different minion types and fuels to see what works best for you.
                            </CardText>

                            <hr />
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
