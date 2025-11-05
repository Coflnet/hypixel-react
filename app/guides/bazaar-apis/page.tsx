import { Metadata } from "next";
import Link from "next/link";
import { Card, CardBody, CardTitle, CardText, Col, Container, Row } from "react-bootstrap";
import { getHeadMetadata } from "../../../utils/SSRUtils";

export const metadata: Metadata = getHeadMetadata(
    "Hypixel Bazaar APIs: A Developer's Guide to Live Price Data",
    "Compare the best free and paid APIs for live Hypixel Bazaar price and volume data, including SkyCofl, the official Hypixel API, and how to use them in Python."
);

export default function BazaarApisGuidePage() {
    return (
        <Container>
            <Row>
                <Col>
                    <Card>
                        <CardBody>
                            <CardTitle as="h1">Hypixel Bazaar APIs: A Developer's Guide to Live Price Data</CardTitle>
                            <CardText>
                                For developers building flipping tools, trackers, or bots, accessing real-time Bazaar price and volume data is essential. This guide compares the best free and paid APIs available, explains how to use them, and provides example code to get you started.
                            </CardText>

                            <CardTitle as="h2" className="mt-4">Comparing Bazaar Data APIs</CardTitle>
                            <CardText>
                                There are several sources for Bazaar data, each with its own strengths and weaknesses.
                            </CardText>

                            <CardTitle as="h3" className="mt-3">1. v API (Recommended)</CardTitle>
                            <CardText>
                                The SkyCofl API is the most powerful and developer-friendly option, specifically designed for economic analysis and flipping.
                            </CardText>
                            <ul>
                                <li><strong>Data Provided:</strong> Real-time buy/sell prices, volumes, flip suggestions, historical data, item metadata, and more.</li>
                                <li><strong>Update Speed:</strong> Near real-time. Data is updated continuously, making it ideal for live applications.</li>
                                <li><strong>Rate Limits:</strong> Generous free tier, with higher limits available for premium users and partners. Authentication is required for most endpoints.</li>
                                <li><strong>Best For:</strong> Building high-speed flipping tools, live price trackers, and arbitrage bots.</li>
                                <li><strong>Paid vs. Free:</strong> The free API provides access to most essential data. Premium tiers unlock more advanced endpoints, higher rate limits, and access to specialized data like demand-based flips.</li>
                            </ul>

                            <CardTitle as="h3" className="mt-3">2. Official Hypixel API</CardTitle>
                            <CardText>
                                Hypixel provides its own public API, which includes a Bazaar product endpoint.
                            </CardText>
                            <ul>
                                <li><strong>Data Provided:</strong> Current buy/sell orders, prices, and recent transactions for all Bazaar products.</li>
                                <li><strong>Update Speed:</strong> Updates approximately every 60 seconds. This delay makes it less suitable for real-time sniping but still useful for general price tracking.</li>
                                <li><strong>Rate Limits:</strong> Typically around 60-120 requests per minute per API key. Requires an API key, which you can generate in-game.</li>
                                <li><strong>Best For:</strong> General-purpose applications, historical analysis, and tools where a 1-minute delay is acceptable.</li>
                            </ul>

                            <CardTitle as="h3" className="mt-3">3. Other Community APIs (TPM, etc.)</CardTitle>
                            <CardText>
                                Other projects, like The Pixels Media (TPM), may offer their own APIs. However, these often act as wrappers around the Hypixel or SkyCofl APIs and may have less reliability, documentation, and support. For serious development, it's best to use one of the primary sources.
                            </CardText>

                            <CardTitle as="h2" className="mt-4">How to Authenticate and Handle Rate Limits</CardTitle>
                            <CardText>
                                Both the SkyCofl and Hypixel APIs require authentication.
                            </CardText>
                            <ul>
                                <li><strong>Hypixel API:</strong> Generate a key in-game with the `/api new` command. Include this key in the `API-Key` header of your requests.</li>
                                <li><strong>SkyCofl API:</strong> Use the <strong>/cofl api</strong> command with our mod to generate a key. This provides access to our powerful, real-time data endpoints. See the <Link href="/wiki/docs/mod-commands#apicommand">API command reference</Link>.</li>
                            </ul>
                            <CardText>
                                Always respect rate limits. Your application should monitor the `RateLimit-Remaining` header in the API response and pause requests when the limit is reached. Implement an exponential backoff strategy to handle 429 (Too Many Requests) errors gracefully.
                            </CardText>

                            <CardTitle as="h2" className="mt-4">Example Code: Fetching Live Bazaar Prices in Python</CardTitle>
                            <CardText>
                                Here is a simple Python script to fetch live Bazaar data from the official Hypixel API.
                            </CardText>
                            <pre><code>{`import requests
import json

# Your Hypixel API key
API_KEY = "YOUR_API_KEY"
BAZAAR_API_URL = "https://api.hypixel.net/skyblock/bazaar"

def get_bazaar_data():
    try:
        response = requests.get(f"{BAZAAR_API_URL}?key={API_KEY}")
        response.raise_for_status()  # Raise an exception for bad status codes
        data = response.json()
        if data.get("success"):
            return data.get("products")
        else:
            print(f"API request failed: {data.get('cause')}")
            return None
    except requests.exceptions.RequestException as e:
        print(f"An error occurred: {e}")
        return None

def main():
    products = get_bazaar_data()
    if products:
        # Example: Print the buy and sell price for Enchanted Diamond
        enchanted_diamond = products.get("ENCHANTED_DIAMOND")
        if enchanted_diamond:
            summary = enchanted_diamond.get("quick_status")
            print("Enchanted Diamond:")
            print(f"  Sell Price (Instant Buy): {summary.get('buyPrice'):.1f}")
            print(f"  Buy Price (Instant Sell): {summary.get('sellPrice'):.1f}")
            print(f"  Volume (Last 7d): {summary.get('sellMovingWeek')}")

if __name__ == "__main__":
    main()
`}</code></pre>
                            <CardText>
                                To use the SkyCofl API for even faster and more detailed data, you would replace the URL and authentication method according to our developer documentation.
                            </CardText>

                            <CardTitle as="h2" className="mt-4">Aggregating Data for Arbitrage Alerts</CardTitle>
                            <CardText>
                                A common use case is to build an arbitrage alert system. This involves:
                            </CardText>
                            <ol>
                                <li><strong>Fetching Data:</strong> Continuously poll the Bazaar API (preferably SkyCofl's for speed) and the Auction House API.</li>
                                <li><strong>Comparing Prices:</strong> For items that can be traded on both markets, compare the Bazaar buy price to the lowest Auction House BIN price.</li>
                                <li><strong>Calculating Profit:</strong> If the price difference is significant after accounting for taxes, trigger an alert (e.g., via a Discord webhook).</li>
                                <li><strong>Setting Thresholds:</strong> In your script, set minimum profit margins and sales volume thresholds to filter out insignificant or risky flips. For example, only alert if the potential profit is &gt;100k and the item has at least 1000 sales per day.</li>
                            </ol>

                            <hr />
                            <CardText>
                                For more advanced strategies, including how to backtest strategies and build a full auction flipper bot, check out our other developer-focused guides.
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
