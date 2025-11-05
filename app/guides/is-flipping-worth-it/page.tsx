import { Metadata } from "next";
import Link from "next/link";
import { Container, Card, CardBody, CardTitle, CardText } from "react-bootstrap";
import { getHeadMetadata } from "../../../utils/SSRUtils";

export const metadata: Metadata = getHeadMetadata(
  "Is It Worth It to Flip in Hypixel Skyblock? | Flipping Guides",
  "Find out if flipping is a worthwhile money-making method in Hypixel Skyblock and if it's the right choice for you."
);

export default function IsFlippingWorthItPage() {
  return (
    <Container className="py-4">
      <Card>
        <CardBody>
          <CardTitle as="h2">Is It Worth It to Flip in Hypixel Skyblock?</CardTitle>

          <CardText>
            Short answer: <strong>Yes</strong>. Flipping can be a reliable way to earn coins if you learn the market, manage risk, and use helpful tools.
            Check the <Link href="/flips">Flipping Hub</Link> for live opportunities and see our <Link href="/guides">Guides</Link> for step-by-step advice.
          </CardText>

          <hr />

          <h3>Quick FAQ</h3>
          <div>
            <p><strong>Do I need a lot of money?</strong> No — you can start with small items and grow capital over time.</p>
            <p><strong>Can I automate this?</strong> Yes — tools like Coflnet can track prices and export history; Premium features offer suggestions and CSV export.</p>
            <p><strong>Is it safe?</strong> In-game flipping is safe when you avoid IRL trading and use trusted tools.</p>
          </div>

          <div className="mt-3">
            <Link href="/guides">Back to Guides</Link>
          </div>
        </CardBody>
      </Card>
    </Container>
  );
}
