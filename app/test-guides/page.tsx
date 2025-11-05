import { Metadata } from "next";
import Link from "next/link";
import { getHeadMetadata } from "../../utils/SSRUtils";

export const metadata: Metadata = getHeadMetadata("Test Guides");

export default function TestGuidesPage() {
    return (
        <div style={{ padding: '1rem' }}>
            <h2>Available Guides (test)</h2>
            <ul>
                <li>
                    <Link href="/guides/what-is-bazaar-flipping">What is Bazaar Flipping?</Link>
                </li>
                <li>
                    <Link href="/guides/getting-started-with-flipping">How to Get Started with Flipping?</Link>
                </li>
                <li>
                    <Link href="/guides/is-flipping-worth-it">Is It Worth It to Flip in Hypixel Skyblock?</Link>
                </li>
            </ul>
        </div>
    );
}
