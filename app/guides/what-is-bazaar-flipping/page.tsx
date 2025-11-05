import { Metadata } from "next";
import Link from "next/link";
import { Card, CardBody, CardTitle, CardText, Col, Container, Row } from "react-bootstrap";
import { getHeadMetadata } from "../../../utils/SSRUtils";

export const metadata: Metadata = getHeadMetadata(
    "What is Bazaar Flipping? | Flipping Guides",
    "Learn the basics of bazaar flipping in Hypixel Skyblock. This guide explains how to make profit by buying and selling items on the bazaar."
);

export default function WhatIsBazaarFlippingPage() {
    return (
        <Container>
            <Row>
                <Col>
                    <Card>
                        <CardBody>
                            <CardTitle as="h2">What is Bazaar Flipping?</CardTitle>
                            <CardText>
                                Bazaar flipping is a method of making profit in Hypixel Skyblock by taking advantage of the price differences in the Bazaar. The basic idea is to buy items for a low price and sell them for a higher price. This is possible because the Bazaar has two different prices for each item: the buy price and the sell price.
                            </CardText>
                            <CardText>
                                The <strong>buy price</strong> is the price that you can instantly buy an item for. This is the price that other players have set in their sell offers.
                            </CardText>
                            <CardText>
                                The <strong>sell price</strong> is the price that you can instantly sell an item for. This is the price that other players have set in their buy orders.
                            </CardText>
                            <CardText>
                                The difference between the buy price and the sell price is called the <strong>margin</strong>. A larger margin means more potential profit.
                            </CardText>
                            <CardTitle as="h3">How to Bazaar Flip</CardTitle>
                            <CardText>
                                There are two main ways to bazaar flip:
                            </CardText>
                            <ol>
                                <li>
                                    <strong>Insta-buy and insta-sell:</strong> This is the simplest method. You buy an item at its buy price and then immediately sell it at its sell price. This method is fast but usually has lower margins.
                                </li>
                                <li>
                                    <strong>Buy orders and sell offers:</strong> This method involves creating a buy order for an item at a low price and then, once the order is filled, creating a sell offer for the same item at a higher price. This method requires more patience but can result in much higher profits.
                                </li>
                            </ol>
                            <CardTitle as="h3">Tips for Successful Bazaar Flipping</CardTitle>
                            <ul>
                                <li>
                                    <strong>Start small:</strong> Don't invest all your coins into one flip. Start with smaller amounts to get a feel for the market.
                                </li>
                                <li>
                                    <strong>Be patient:</strong> Prices fluctuate. Sometimes you need to wait for the right moment to buy or sell.
                                </li>
                                <li>
                                    <strong>Use tools:</strong> Websites like this one can help you identify items with high profit margins.
                                </li>
                                <li>
                                    <strong>Consider volume:</strong> An item might have a high margin, but if only a few are traded per hour, your potential profit is limited. Look for items with both good margins and high trade volume.
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
