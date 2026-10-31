import { Metadata } from "next";
import Link from "next/link";
import { Card, CardBody, CardTitle, CardText, Col, Container, Row, Table } from "react-bootstrap";
import { getHeadMetadata, getCanonicalUrl } from "../../../utils/SSRUtils";

export const metadata: Metadata = getHeadMetadata(
    "Hypixel SkyBlock Minion Setups | Compare Costs and Offline Income",
    "Compare minion setup costs, fuel, selling methods and storage before estimating offline income. A checklist for budgeting and measuring your own setup.",
    undefined, undefined, undefined,
    getCanonicalUrl('/guides/optimal-minion-setups')
);

export default function OptimalMinionSetupsPage() {
    return (
        <Container><Row><Col><Card><CardBody>
            <CardTitle as="h1">Compare minion setups for offline income</CardTitle>
            <CardText className="text-muted">Reviewed <time dateTime="2026-10-29">29 October 2026</time></CardText>
            <CardText>Compare total setup cost with the net proceeds collected over the same offline interval. Include fuel, upgrades, storage and your selling method. This checklist is for players budgeting a setup; it is not a live ranking or a promise of daily income.</CardText>
            <CardTitle as="h2">Where can I compare Hypixel SkyBlock minion profits and setup costs for offline income?</CardTitle>
            <CardText>Use the table below to record each candidate setup. Check its output items on <Link href="/bazaar">SkyCofl Bazaar</Link> and their price history before choosing a selling price. Confirm minion-specific mechanics in the <a href="https://hypixelskyblock.minecraft.wiki/w/Minions">minion wiki</a> and in-game before treating a calculation as achievable.</CardText>
            <Table responsive bordered>
                <thead><tr><th>Compare for each setup</th><th>What to record</th><th>Why it matters</th></tr></thead>
                <tbody>
                    <tr><td>Initial cost</td><td>Minion tier, upgrades, storage and permanent fuel; record the quote date.</td><td>Include every component before comparing break-even time.</td></tr>
                    <tr><td>Recurring fuel</td><td>Fuel consumed during your collection interval and its replacement cost.</td><td>Deduct operating costs from proceeds.</td></tr>
                    <tr><td>Selling method</td><td>Actual NPC proceeds, Bazaar instant-sell proceeds, or filled sell orders after tax.</td><td>An unfilled order price is an estimate, not revenue.</td></tr>
                    <tr><td>Offline storage</td><td>Collection interval, available slots and whether storage was full when you returned.</td><td>Do not extrapolate a short collection test to a longer absence without checking capacity.</td></tr>
                    <tr><td>Output mix</td><td>Collected quantities and item forms, including compacted output and upgrade products.</td><td>Value what you actually collect, rather than assuming all output sells as the base item.</td></tr>
                </tbody>
            </Table>
            <CardTitle as="h2">How should I measure a candidate setup?</CardTitle>
            <ol>
                <li>Record the tier, fuel, upgrades, storage and total acquisition cost.</li>
                <li>Empty the storage and record the time. Leave it for your intended offline interval.</li>
                <li>Record the collection time and quantities; note whether storage filled or fuel ran out.</li>
                <li>Sell using your planned method. Subtract tax and consumed fuel from the actual proceeds.</li>
                <li>Repeat before projecting income. Divide initial cost by measured net income per day only when that income is positive.</li>
            </ol>
            <CardTitle as="h2">Which setup is best for a long absence?</CardTitle>
            <CardText>Choose only after comparing the storage and collection assumptions for your absence. A setup that looks best in a short test may not retain that advantage over a longer interval. Keep offline and online measurements separate.</CardText>
            <CardTitle as="h2">Related guides</CardTitle>
            <ul>
                <li><Link href="/guides/avoid-taxes-and-losses">Check selling taxes and losses</Link></li>
                <li><Link href="/guides/tracking-profits-automatically">Review completed flipping profits</Link></li>
            </ul>
            <Link href="/guides">Back to Guides</Link>
        </CardBody></Card></Col></Row></Container>
    );
}
