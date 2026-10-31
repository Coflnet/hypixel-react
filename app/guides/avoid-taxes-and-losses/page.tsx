import { Metadata } from "next";
import Link from "next/link";
import { Card, CardBody, CardTitle, CardText, Col, Container, Row } from "react-bootstrap";
import { getHeadMetadata, getCanonicalUrl } from "../../../utils/SSRUtils";

const LAST_UPDATED_ISO = "2026-10-29";
const LAST_UPDATED_LABEL = "October 29, 2026";

export const metadata: Metadata = getHeadMetadata(
    "Minimize Flipping Taxes & Losses | Bazaar Fees, AH Tax, Price Crashes",
    "Check Bazaar sales tax, Auction House fees and actual sale proceeds before estimating net flip profit. Separate costs from opportunity estimates.",
    undefined,
    [],
    undefined,
    getCanonicalUrl('/guides/avoid-taxes-and-losses')
);

export default function AvoidTaxesAndLossesPage() {
    return (
        <Container>
            <Row>
                <Col>
                    <Card>
                        <CardBody>
                            <CardTitle as="h1">How to Avoid Common Flipping Taxes and Transfer Losses</CardTitle>
                            <CardText className="text-muted small mb-0">
                                Last updated <time dateTime={LAST_UPDATED_ISO}>{LAST_UPDATED_LABEL}</time>
                            </CardText>
                            <CardText>
                                Every flip you make in Hypixel Skyblock comes with costs beyond just the purchase price. Understanding and minimizing these taxes and fees is essential to maintaining healthy profit margins.
                            </CardText>

                            <CardTitle as="h2" className="mt-4">Bazaar sales tax</CardTitle>
                            <CardText>Apply the sales-tax rate shown in-game to sale proceeds, not to both the purchase and sale. Check the rate applicable to your account, including community upgrades. Do not assume manual claiming gives a discount.</CardText>
                            <CardText>Net profit = quantity × (sale price × (1 − sales-tax rate) − purchase price) − other costs. If the recorded proceeds are already net of tax, subtract purchase cost and other expenses without deducting tax again.</CardText>
                            <CardText>Use filled quantities for realized profit. Unfilled orders and current quotes are estimates; see the <Link href="/guides/how-to-make-money-with-bazaar-flipping">Bazaar budget and fill checklist</Link> for a dated market snapshot.</CardText>
                            <CardTitle as="h2" className="mt-4">Auction House fees</CardTitle>
                            <CardText>Account for the listing and claiming charges shown in-game and any item upgrade expenses. The <code>/cofl ahtax &lt;sellAmount&gt;</code> command is documented in the <Link href="/wiki/mod-commands">command reference</Link>. Check its assumptions, including mayor effects, before using its result.</CardText>
                            <CardTitle as="h2" className="mt-4">Check costs before committing coins</CardTitle>
                            <ul>
                                <li>Choose the selling method first: an instant exit and a waiting sell order can have different proceeds.</li>
                                <li>Keep open-order costs within your available coins and consider how long the capital may be tied up.</li>
                                <li>Recheck prices and order depth when an order only partially fills.</li>
                                <li>Inspect the current price before relisting; a prior target price does not guarantee a buyer.</li>
                                <li>Keep receipts for purchases, sales and upgrades, including losing trades.</li>
                            </ul>
                            <CardTitle as="h2" className="mt-4">Does a positive spread guarantee profit?</CardTitle>
                            <CardText>No. Sales tax, price changes, unfilled orders and additional expenses can consume the spread. Compare actual proceeds after costs with what you paid.</CardText>
                            <CardTitle as="h2" className="mt-4">How do I verify what I earned?</CardTitle>
                            <CardText>Use the <Link href="/guides/tracking-profits-automatically">profit tracker workflow</Link> to inspect completed auction records. Reconcile each trade&apos;s costs before relying on the aggregate total.</CardText>

                            <CardTitle as="h2" className="mt-4">Related guides</CardTitle>
                            <ul>
                                <li><Link href="/guides/how-to-flip">How to Flip</Link> — mechanics review</li>
                                <li><Link href="/guides/tracking-profits-automatically">Track Profits Automatically</Link> — SkyCofl Mod setup</li>
                                <li><Link href="/guides/how-to-avoid-scams">How to Avoid Scams</Link></li>
                                <li><Link href="/mayor">Mayor Flips</Link> — see mayor perks affecting prices</li>
                                <li><Link href="/topMovers">Top Movers</Link> — avoid volatile items</li>
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
