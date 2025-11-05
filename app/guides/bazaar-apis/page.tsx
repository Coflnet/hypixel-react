import { Metadata } from "next";
import Link from "next/link";
import { Card, CardBody, CardTitle, CardText, Col, Container, Row } from "react-bootstrap";
import { getHeadMetadata } from "../../../utils/SSRUtils";

export const metadata: Metadata = getHeadMetadata(
    "Hypixel Bazaar APIs: Developer Guide to Real-Time Price Data & Integration",
    "Complete guide to Bazaar APIs: SkyCofl API, Hypixel API, authentication, rate limits, Python examples, building arbitrage bots, historical data, error handling, and best practices."
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

                            <CardTitle as="h2" className="mt-4">Best Practices for API Integration</CardTitle>

                            <CardTitle as="h3" className="mt-3">1. Implement Robust Error Handling</CardTitle>
                            <CardText>
                                APIs can fail—networks go down, servers restart, rate limits are hit. Your application should:
                            </CardText>
                            <ul>
                                <li>Retry failed requests with exponential backoff (1s, 2s, 4s, 8s...)</li>
                                <li>Log errors with timestamps for debugging</li>
                                <li>Gracefully degrade (use cached data if API is down)</li>
                                <li>Monitor uptime and alert if API is unavailable for &gt;5 minutes</li>
                            </ul>

                            <CardTitle as="h3" className="mt-3">2. Cache Data Locally</CardTitle>
                            <CardText>
                                Don't fetch every single item on every request. Store data in a local database (SQLite, PostgreSQL) and update on a schedule:
                            </CardText>
                            <ul>
                                <li><strong>High-frequency:</strong> Update top 100 items every 10–30 seconds</li>
                                <li><strong>Medium-frequency:</strong> Update mid-tier items every 60–300 seconds</li>
                                <li><strong>Low-frequency:</strong> Update niche items every 5–10 minutes</li>
                            </ul>
                            <CardText>
                                This reduces API load and improves response times for your users.
                            </CardText>

                            <CardTitle as="h3" className="mt-3">3. Respect Rate Limits (Or Face Bans)</CardTitle>
                            <CardText>
                                <strong>Important:</strong> Exceeding rate limits can get your IP or API key banned from the API. Monitor the `RateLimit-Remaining` header and implement backoff strategies. For SkyCofl APIs, contact support for higher limits if needed.
                            </CardText>

                            <CardTitle as="h3" className="mt-3">4. Use Appropriate Data Structures</CardTitle>
                            <CardText>
                                Store Bazaar data efficiently:
                            </CardText>
                            <ul>
                                <li><strong>Current prices:</strong> In-memory cache (Redis) for speed</li>
                                <li><strong>Historical data:</strong> Time-series database (InfluxDB) or data warehouse (BigQuery)</li>
                                <li><strong>Derived metrics:</strong> Price trends, moving averages, volatility (computed on-demand)</li>
                            </ul>

                            <CardTitle as="h2" className="mt-4">Advanced: Building a Flipping Bot with APIs</CardTitle>

                            <CardTitle as="h3" className="mt-3">Architecture Overview</CardTitle>
                            <CardText>
                                A full-featured flipping bot requires:
                            </CardText>
                            <ul>
                                <li><strong>Data Layer:</strong> Fetch from SkyCofl API every 10–30 seconds</li>
                                <li><strong>Analysis Layer:</strong> Calculate spreads, margins, volumes, identify opportunities</li>
                                <li><strong>Decision Layer:</strong> Evaluate risk/reward; determine when to buy/sell</li>
                                <li><strong>Action Layer:</strong> Place orders via the Hypixel game client (manual or semi-automated)</li>
                                <li><strong>Monitoring Layer:</strong> Track profitability, alert on errors, log all decisions</li>
                            </ul>

                            <CardTitle as="h3" className="mt-3">Critical: Automation Risks</CardTitle>
                            <CardText>
                                <strong>⚠️ WARNING:</strong> Any bot that places orders automatically, claims items, or manipulates game mechanics is <strong>against Hypixel ToS and risks a ban.</strong> The SkyCofl API is designed to <strong>inform</strong> human traders, not replace them. Use APIs for analysis only; keep human control of actual flipping decisions.
                            </CardText>
                            <CardText>
                                Safe approach: Use the API to find opportunities, alert humans, and let humans confirm before buying/selling.
                            </CardText>

                            <CardTitle as="h2" className="mt-4">Data Structures & Field Meanings</CardTitle>

                            <CardTitle as="h3" className="mt-3">Bazaar Product Object (SkyCofl/Hypixel API)</CardTitle>
                            <pre style={{ backgroundColor: "#f5f5f5", padding: "10px", borderRadius: "4px", overflowX: "auto" }}>
                                <code>{`{
  "product_name": "ENCHANTED_DIAMOND",
  "sell_summary": [
    { "amount": 1000, "pricePerUnit": 45.5, "orders": 25 }
  ],
  "buy_summary": [
    { "amount": 500, "pricePerUnit": 42.0, "orders": 10 }
  ],
  "quick_status": {
    "productId": "ENCHANTED_DIAMOND",
    "sellPrice": 42.0,
    "sellVolume": 50000,
    "sellMovingWeek": 500000,
    "buyPrice": 45.5,
    "buyVolume": 30000,
    "buyMovingWeek": 400000
  }
}`}</code>
                            </pre>
                            <CardText>
                                <strong>Key fields:</strong>
                            </CardText>
                            <ul>
                                <li><strong>sell_price:</strong> Price to SELL instantly (current market ask)</li>
                                <li><strong>buy_price:</strong> Price to BUY instantly (current market bid)</li>
                                <li><strong>spread:</strong> buy_price - sell_price (your potential profit per unit)</li>
                                <li><strong>volume:</strong> How many units traded in last 24h (liquidity indicator)</li>
                                <li><strong>moving_week:</strong> Volume over 7 days (longer-term trend)</li>
                            </ul>

                            <hr />
                            <CardTitle as="h4" className="mt-4">FAQ: Bazaar APIs & Development</CardTitle>

                            <Card className="mt-3" style={{ backgroundColor: "#f8f9fa" }}>
                                <CardBody>
                                    <CardTitle as="h5">Q: Which API should I use for a personal flipping tool?</CardTitle>
                                    <CardText>
                                        <strong>A:</strong> Start with SkyCofl API for speed and data richness. The free tier is generous. If you need historical data spanning months, use the Hypixel API as a fallback (it's slower but always available).
                                    </CardText>
                                </CardBody>
                            </Card>

                            <Card className="mt-3" style={{ backgroundColor: "#f8f9fa" }}>
                                <CardBody>
                                    <CardTitle as="h5">Q: Can I build a bot that automatically places orders?</CardTitle>
                                    <CardText>
                                        <strong>A:</strong> No. Any automation that interacts with the game (placing orders, claiming items, chatting) violates Hypixel ToS. Use APIs for analysis; keep humans in control of all actual trading decisions. The SkyCofl Mod's <strong>/cofl bazaar</strong> command helps humans make fast decisions, but it doesn't automate execution.
                                    </CardText>
                                </CardBody>
                            </Card>

                            <Card className="mt-3" style={{ backgroundColor: "#f8f9fa" }}>
                                <CardBody>
                                    <CardTitle as="h5">Q: What's the difference between SkyCofl and Hypixel API data?</CardTitle>
                                    <CardText>
                                        <strong>A:</strong> SkyCofl aggregates and enhances Hypixel data with calculated fields (demand analysis, flip suggestions, historical trends). Hypixel API provides raw order data. SkyCofl is faster and smarter; Hypixel is lower-latency but less processed.
                                    </CardText>
                                </CardBody>
                            </Card>

                            <Card className="mt-3" style={{ backgroundColor: "#f8f9fa" }}>
                                <CardBody>
                                    <CardTitle as="h5">Q: How often should I poll the API?</CardTitle>
                                    <CardText>
                                        <strong>A:</strong> For alerting on real-time opportunities, poll every 10–30 seconds. For background analysis, every 60 seconds is fine. Faster polling uses more API quota and doesn't add much value (markets don't change faster than that for most items).
                                    </CardText>
                                </CardBody>
                            </Card>

                            <Card className="mt-3" style={{ backgroundColor: "#f8f9fa" }}>
                                <CardBody>
                                    <CardTitle as="h5">Q: Can I resell data from the Bazaar API?</CardTitle>
                                    <CardText>
                                        <strong>A:</strong> No. Both Hypixel and SkyCofl APIs have terms of service. Generally, you can use the data for personal tools and analysis, but not to compete with existing services or resell without permission. Always check the specific API's ToS.
                                    </CardText>
                                </CardBody>
                            </Card>

                            <Card className="mt-3" style={{ backgroundColor: "#f8f9fa" }}>
                                <CardBody>
                                    <CardTitle as="h5">Q: How do I get a SkyCofl API key?</CardTitle>
                                    <CardText>
                                        <strong>A:</strong> Use the <strong>/cofl api</strong> command in-game with the SkyCofl Mod installed. This generates a key that you can use in your API requests. Store it securely (don't commit to GitHub!).
                                    </CardText>
                                </CardBody>
                            </Card>

                            <Card className="mt-3" style={{ backgroundColor: "#f8f9fa" }}>
                                <CardBody>
                                    <CardTitle as="h5">Q: What if I exceed my API rate limit?</CardTitle>
                                    <CardText>
                                        <strong>A:</strong> You'll receive a 429 (Too Many Requests) response. Implement exponential backoff (wait 1s, then 2s, then 4s, etc. before retrying). If you consistently need more requests, contact SkyCofl support for a higher tier API key.
                                    </CardText>
                                </CardBody>
                            </Card>

                            <Card className="mt-3" style={{ backgroundColor: "#f8f9fa" }}>
                                <CardBody>
                                    <CardTitle as="h5">Q: Can I use APIs to build a Discord bot for flip alerts?</CardTitle>
                                    <CardText>
                                        <strong>A:</strong> Yes! That's a perfect use case. Fetch Bazaar data, identify high-margin flips, and send Discord webhooks alerting users. Many communities do this. No automation concerns since humans still decide what to flip.
                                    </CardText>
                                </CardBody>
                            </Card>

                            <Card className="mt-3" style={{ backgroundColor: "#f8f9fa" }}>
                                <CardBody>
                                    <CardTitle as="h5">Q: Where can I find comprehensive API documentation?</CardTitle>
                                    <CardText>
                                        <strong>A:</strong> Visit <Link href="https://docs.coflnet.com">SkyCofl Developer Docs</Link> for comprehensive endpoint reference and examples. For Hypixel API, see the official Hypixel forums. Both have active communities for questions.
                                    </CardText>
                                </CardBody>
                            </Card>

                            <hr />
                            <CardText>
                                <strong>Next steps:</strong> Generate your API key with <strong>/cofl api</strong>, read the official documentation, and start building! Use the SkyCofl API to empower informed trading decisions—keeping humans in control and accounts safe.
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
