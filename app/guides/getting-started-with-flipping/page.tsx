import { Metadata } from "next";
import Link from "next/link";
import { Card, CardBody, CardTitle, CardText, Col, Container, Row } from "react-bootstrap";
import { getHeadMetadata } from "../../../utils/SSRUtils";

export const metadata: Metadata = getHeadMetadata(
    "How to Get Started with Flipping? | Flipping Guides",
    "A beginner's guide to start flipping in Hypixel Skyblock. Learn the prerequisites and first steps to make profit."
);

export default function GettingStartedWithFlippingPage() {
    return (
        <Container>
            <Row>
                <Col>
                    <Card>
                        <CardBody>
                            <CardTitle as="h2">How to Get Started with Flipping?</CardTitle>
                            <CardText>
                                Getting started with flipping in Hypixel Skyblock can be a great way to earn coins. Here’s a step-by-step guide to help you begin.
                            </CardText>
                            <CardTitle as="h3">Prerequisites</CardTitle>
                            <ul>
                                <li>
                                    <strong>A bit of starting capital:</strong> You don't need millions, but having at least a few hundred thousand coins will make it easier to start. You can earn this initial capital through farming, mining, or completing quests.
                                </li>
                                <li>
                                    <strong>Bazaar Unlocked:</strong> You need to have access to the Bazaar, which is unlocked at SkyBlock Level 7.
                                </li>
                                <li>
                                    <strong>Basic knowledge of the game:</strong> Understanding the basics of the game, such as what items are in demand, will be very helpful.
                                </li>
                            </ul>
                            <CardTitle as="h3">First Steps</CardTitle>
                            <ol>
                                <li>
                                    <strong>Identify potential flips:</strong> Use a tool like this website to find items with a good profit margin and high trade volume. Look for items that you can afford with your current capital.
                                </li>
                                <li>
                                    <strong>Start with buy orders:</strong> Instead of instantly buying items, create buy orders. This allows you to purchase items for a lower price, increasing your potential profit.
                                </li>
                                <li>
                                    <strong>Be patient:</strong> Once your buy order is filled, create a sell offer for a higher price. It might take some time for your items to sell, so be patient.
                                </li>
                                <li>
                                    <strong>Reinvest your profits:</strong> As you make profits, reinvest them to flip more expensive items with potentially higher margins.
                                </li>
                            </ol>
                            <CardTitle as="h3">What to Avoid</CardTitle>
                            <ul>
                                <li>
                                    <strong>Don't get greedy:</strong> It's better to make a small, guaranteed profit than to risk losing money by waiting for a huge margin that may never come.
                                </li>
                                <li>
                                    <strong>Don't put all your eggs in one basket:</strong> Diversify your flips. Don't invest all your money in a single item. We recommend splitting your purchases between 10 skyblock items minimizing the risk of lossing everything to virtually 0.
                                </li>
                                <li>
                                    <strong>Watch out for market manipulation:</strong> Some players try to manipulate the market. Be cautious of items with sudden, drastic price changes.
                                </li>
                            </ul>
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
