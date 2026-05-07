---
title: "Programmatic API access"
description: "API access for developers"
order: 10
---

We provide a free API for developers to access most of our data. You can check out the openapi documentation [here](https://sky.coflnet.com/api).

## Player Data
We extract player-specific game data via our mod directly from SkyBlock to build features with.  
Player-scoped endpoints live under `/api/player/` and use **player API keys** generated via `/cofl api` in the mod.  
Those keys currently expire after 180 days and can be passed in any of these forms:
* Via query parameter `?apiKey=YOUR_API_KEY`
* Via query parameter `?apikey=YOUR_API_KEY` or `?key=YOUR_API_KEY`
* Via header `X-Api-Key: YOUR_API_KEY` or `x-api-key: YOUR_API_KEY`

### Attributes
You can get the player's extracted in-game state via `/api/player/extracted`. That payload is reused for attributes, booster cookie state, composter data, and Heart of the Mountain / Heart of the Forest data whenever the mod syncs those screens in-game.

### Bazaar Orders
You can get the current bazaar orders of a player via `/api/player/bazaar/orders`. It contains order size, price, and the last known fill state.

### Bazaar Flips
You can get completed bazaar flips tracked by the mod via `/api/player/bazaar/flips`.

### Booster Cookie 
You can get the player's current booster cookie expiry via `/api/player/extracted`.

### Composter
You can get the player's current composter upgrades and fill state via `/api/player/extracted`.

### Heart of the forest
You can get the player's current Heart of the Forest and Heart of the Mountain state via `/api/player/extracted`.

### Missing any data?
If you need any other data that is visible in game, please contact us via Discord or email. Alternatively open a pull request yourself in the [PlayerState repository](https://github.com/Coflnet/SkyPlayerState) which handles the data extraction and storage or the [API repository](https://github.com/Coflnet/SkyApi) which exposes the data.

## Bazaar

The Bazaar API provides real-time access to Skyblock Bazaar data including current prices, order history, and price trends. For all endpoints see [OpenAPI documentation](https://sky.coflnet.com/api).

### Bazaar Current Prices

Get the current snapshot of bazaar prices for a specific item.

**Endpoint:** `GET /api/bazaar/{itemTag}/snapshot`

**Parameters:**
- `itemTag` (path, required): The item tag to get bazaar data for (e.g., `GOLD_BLOCK`, `COPPER`)
- `timestamp` (query, optional): Specific timestamp to retrieve data at (defaults to now)

**Response:**
```json
{
  "productId": "GOLD_BLOCK",
  "buyPrice": 10.5,
  "buyVolume": 150000,
  "buyMovingWeek": 2500000,
  "buyOrdersCount": 12,
  "sellPrice": 11.2,
  "sellVolume": 200000,
  "sellMovingWeek": 3000000,
  "sellOrdersCount": 8,
  "timeStamp": "2024-12-07T10:30:00Z",
  "buyOrders": [
    {
      "amount": 500000,
      "pricePerUnit": 10.5,
      "orders": 3
    }
  ],
  "sellOrders": [
    {
      "amount": 600000,
      "pricePerUnit": 11.2,
      "orders": 5
    }
  ]
}
```

**Example cURL:**
```bash
curl -X GET "https://sky.coflnet.com/api/bazaar/GOLD_BLOCK/snapshot"
```

**Example JavaScript:**
```javascript
async function getBazaarPrice(itemTag) {
  const response = await fetch(`https://sky.coflnet.com/api/bazaar/${itemTag}/snapshot`);
  const data = await response.json();
  console.log(`${itemTag} - Buy: ${data.buyPrice}, Sell: ${data.sellPrice}`);
  return data;
}

// Usage
getBazaarPrice('GOLD_BLOCK');
```

### Bazaar Price History

Get historical price data for bazaar items at different time intervals.

**Endpoints:**
- `GET /api/bazaar/{itemTag}/history/hour` - Last hour (1-minute intervals)
- `GET /api/bazaar/{itemTag}/history/day` - Last day (5-minute intervals)
- `GET /api/bazaar/{itemTag}/history/week` - Last week (2-hour intervals)
- `GET /api/bazaar/{itemTag}/history` - Custom date range

**Parameters:**
- `itemTag` (path, required): The item tag
- `start` (query, optional for custom range): Start timestamp (ISO 8601)
- `end` (query, optional for custom range): End timestamp (ISO 8601)

**Response:**
```json
[
  {
    "minBuy": 10.2,
    "maxBuy": 10.8,
    "buy": 10.5,
    "minSell": 11.0,
    "maxSell": 11.5,
    "sell": 11.2,
    "buyVolume": 150000,
    "sellVolume": 200000,
    "buyMovingWeek": 2500000,
    "sellMovingWeek": 3000000,
    "timestamp": "2024-12-07T10:00:00Z"
  }
]
```

**Example cURL:**
```bash
# Last 24 hours
curl -X GET "https://sky.coflnet.com/api/bazaar/GOLD_BLOCK/history/day"

# Custom date range
curl -X GET "https://sky.coflnet.com/api/bazaar/GOLD_BLOCK/history?start=2024-12-01T00:00:00Z&end=2024-12-07T23:59:59Z"
```

**Example Python:**
```python
import requests
from datetime import datetime, timedelta

def get_bazaar_history(item_tag, days=7):
    """Get bazaar price history for the last N days"""
    end = datetime.utcnow()
    start = end - timedelta(days=days)
    
    url = f"https://sky.coflnet.com/api/bazaar/{item_tag}/history"
    params = {
        "start": start.isoformat() + "Z",
        "end": end.isoformat() + "Z"
    }
    
    response = requests.get(url, params=params)
    return response.json()

# Usage
history = get_bazaar_history('GOLD_BLOCK')
for entry in history:
    print(f"{entry['timestamp']}: Buy {entry['buy']}, Sell {entry['sell']}")
```

### Bazaar Export

Download raw bazaar snapshots for local analysis.

**Endpoint:** `GET /api/bazaar/{itemTag}/export`

**Authentication:** Requires an authenticated account token. Use `Authorization: Bearer YOUR_TOKEN`. The legacy `GoogleToken: YOUR_TOKEN` header is still accepted by the backend, but new integrations should prefer `Authorization`.

**Parameters:**
- `itemTag` (path, required): The bazaar item tag to export
- `start` (query, optional): Export start time as ISO 8601. If omitted, the export starts 14 days ago.
- `end` (query, optional): Export end time as ISO 8601. Defaults to now.
- `fullOrderBook` (query, optional, default `false`): Include full order-book snapshots. This costs 3 export units instead of 1.

**Tier gates:**
- `Premium`: Export up to 180 days back
- `Premium+`: Export back to October 2019
- `Free`: No export access

**Response:**
- Streams a `.zip` file containing `{itemTag}.json`
- Without explicit `start` / `end`, the default export returns the last 14 days
- Recent windows use 20-second bazaar snapshots; older windows fall back to coarser 5-minute data

**Example cURL:**
```bash
curl -L \
  -H "Authorization: Bearer YOUR_TOKEN" \
  "https://sky.coflnet.com/api/bazaar/BOOSTER_COOKIE/export?start=2026-04-01T00:00:00Z&end=2026-04-07T00:00:00Z"
```

## Item Price Analysis

For auction-backed item analysis beyond simple LBIN or history charts, use the advanced analysis endpoint.

**Endpoint:** `GET /api/item/price/{itemTag}/analysis`

**Parameters:**
- `itemTag` (path, required): The item tag to analyze
- `days` (query, optional, default `7`): Analysis window, clamped to `1-365`
- Additional item filters (query, optional): Any supported item filters can be passed directly as query parameters, similar to other `/api/item/price/*` endpoints

**Tier gates:**
- `1-7` days: Free
- `8-30` days: Starter Premium
- `31-365` days: Premium

**Response highlights:**
- Total sales, sales per day, BIN percentage, and top sellers
- Average and median price
- Average and median sell time
- Price volatility (`priceStdDev`, `priceCoeffVariation`)
- Volume buckets and sell-speed buckets
- Hourly breakdown by sale count, average price, and average sell time

**Example cURL:**
```bash
curl "https://sky.coflnet.com/api/item/price/HYPERION/analysis?days=30&Tier=LEGENDARY"
```

## Auctions

The Auctions API provides access to item listings on the Hypixel Auction House.

### Get Lowest Bin Price

Get the lowest bin (Buy It Now) auctions for an item.

**Endpoint:** `GET /api/auctions/tag/{itemTag}/active/bin`

**Parameters:**
- `itemTag` (path, required): The item tag to search for
- `query` (query, optional): Additional filters as query parameters

**Response:**
```json
[
  {
    "uuid": "auction-uuid-1",
    "tag": "GOLD_BLOCK",
    "itemName": "Gold Block",
    "startingBid": 10000,
    "highestBidAmount": 10000,
    "bin": true,
    "end": "2024-12-07T12:30:00Z",
    "auctioneerId": "player-uuid",
    "count": 64,
    "category": "BLOCKS",
    "tier": "COMMON",
    "reforge": "NONE",
    "itemCreatedAt": "2024-12-07T10:30:00Z"
  }
]
```

**Example cURL:**
```bash
curl -X GET "https://sky.coflnet.com/api/auctions/tag/HYPERION/active/bin"
```

**Example Node.js:**
```javascript
const axios = require('axios');

async function getLowestBins(itemTag) {
  try {
    const response = await axios.get(
      `https://sky.coflnet.com/api/auctions/tag/${itemTag}/active/bin`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching auctions:', error);
  }
}

// Usage
getLowestBins('GOLD_BLOCK').then(auctions => {
  auctions.forEach(auction => {
    console.log(`${auction.itemName}: ${auction.startingBid} coins`);
  });
});
```

### Active Auctions Overview

Get a preview of active auctions with sorting options.

**Endpoint:** `GET /api/auctions/tag/{itemTag}/active/overview`

**Parameters:**
- `itemTag` (path, required): The item tag
- `query` (query, optional): Filters and sorting
  - `orderBy`: `LOWEST_PRICE` (default), `HIGHEST_PRICE`, `ENDING_SOON`

**Response:**
```json
[
  {
    "uuid": "auction-uuid",
    "seller": "player-uuid",
    "playerName": "PlayerName",
    "price": 10000,
    "end": "2024-12-07T12:30:00Z"
  }
]
```

**Example cURL:**
```bash
# Get cheapest auctions
curl -X GET "https://sky.coflnet.com/api/auctions/tag/GOLD_BLOCK/active/overview"

# Get auctions ending soon
curl -X GET "https://sky.coflnet.com/api/auctions/tag/GOLD_BLOCK/active/overview?orderBy=ENDING_SOON"
```

### Recently Sold Auctions

Get auctions that sold recently for price statistics.

**Endpoint:** `GET /api/auctions/tag/{itemTag}/sold`

**Parameters:**
- `itemTag` (path, required): The item tag
- `page` (query, optional): Page number (default: 0)
- `pageSize` (query, optional): Results per page 1-1000 (default: 1000)
- `token` (query, optional): Partner token for increased rate limits

**Response:**
```json
[
  {
    "uuid": "auction-uuid",
    "tag": "GOLD_BLOCK",
    "itemName": "Gold Block",
    "startingBid": 9500,
    "highestBidAmount": 10200,
    "bin": true,
    "end": "2024-12-06T10:30:00Z",
    "count": 64
  }
]
```

**Example cURL:**
```bash
# Get first page of sold auctions
curl -X GET "https://sky.coflnet.com/api/auctions/tag/GOLD_BLOCK/sold?page=0&pageSize=100"
```

**Example PHP:**
```php
<?php
function getSoldAuctions($itemTag, $page = 0, $pageSize = 100) {
    $url = "https://sky.coflnet.com/api/auctions/tag/{$itemTag}/sold";
    
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url . "?page={$page}&pageSize={$pageSize}",
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
    ]);
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    return json_decode($response, true);
}

// Usage
$auctions = getSoldAuctions('GOLD_BLOCK');
foreach ($auctions as $auction) {
    echo $auction['itemName'] . ' sold for ' . $auction['highestBidAmount'] . ' coins' . PHP_EOL;
}
?>
```

### Get Specific Auction Details

Get detailed information about a specific auction.

**Endpoint:** `GET /api/auction/{auctionUuid}`

**Parameters:**
- `auctionUuid` (path, required): The UUID of the auction

**Response:**
```json
{
  "uuid": "auction-uuid",
  "tag": "GOLD_BLOCK",
  "itemName": "Gold Block",
  "count": 64,
  "startingBid": 10000,
  "highestBidAmount": 10500,
  "bin": true,
  "start": "2024-12-07T10:00:00Z",
  "end": "2024-12-07T12:30:00Z",
  "auctioneerId": "player-uuid",
  "profileId": "profile-uuid",
  "bids": [
    {
      "bidder": "bidder-uuid",
      "amount": 10200,
      "timestamp": "2024-12-07T10:15:00Z"
    },
    {
      "bidder": "bidder-uuid-2",
      "amount": 10500,
      "timestamp": "2024-12-07T11:00:00Z"
    }
  ],
  "enchantments": [],
  "category": "BLOCKS",
  "tier": "COMMON",
  "reforge": "NONE"
}
```

**Example cURL:**
```bash
curl -X GET "https://sky.coflnet.com/api/auction/12345678-1234-1234-1234-123456789012"
```

**Example Go:**
```go
package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

type Auction struct {
	UUID              string `json:"uuid"`
	Tag               string `json:"tag"`
	ItemName          string `json:"itemName"`
	HighestBidAmount  int64  `json:"highestBidAmount"`
	BIN               bool   `json:"bin"`
	End               string `json:"end"`
}

func getAuctionDetails(auctionUUID string) (*Auction, error) {
	resp, err := http.Get(fmt.Sprintf("https://sky.coflnet.com/api/auction/%s", auctionUUID))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var auction Auction
	json.Unmarshal(body, &auction)
	return &auction, nil
}

func main() {
	auction, _ := getAuctionDetails("12345678-1234-1234-1234-123456789012")
	fmt.Printf("Item: %s, Price: %d\n", auction.ItemName, auction.HighestBidAmount)
}
```

## Flip Utility Endpoints

These endpoints back several website tools and current in-game commands.

| Endpoint | Purpose | Auth / Tier |
|----------|---------|-------------|
| `GET /api/flip/attribute` | Attribute craft flips | `Authorization` token + Premium |
| `GET /api/flip/npc` | Buy-to-NPC profit ideas | Public |
| `GET /api/flip/npc/reverse` | Reverse NPC flips | `Authorization` token; `requestRefresh=true` only refreshes for Premium |
| `GET /api/flip/fusion` | Single-step fusion flips | Public |
| `GET /api/flip/fusion/multistep` | Multi-step fusion flips | `Authorization` token + Starter Premium |
| `GET /api/flip/copper` | Copper conversion flips | Public |

## Lowball Offers

Lowball offers are exposed through the SkyApi wrapper and backed by the lowball offer service in SkyModCommands.

**Endpoints:**
- `GET /api/lowball/own` - List your own offers. Requires `Authorization: Bearer YOUR_TOKEN`.
- `GET /api/lowball/item/{itemTag}` - Browse current public offers for an item.
- `DELETE /api/lowball/offer/{offerId}` - Delete one of your own offers. Requires `Authorization: Bearer YOUR_TOKEN`.

**Query parameters:**
- `before` (optional): ISO 8601 cursor for pagination
- `limit` (optional, default `20`): Number of results to return

**Current behavior:**
- Offers are retained for roughly 7 days
- Pagination uses the offer creation timestamp (`before=<timestamp>`)
- The public item listing endpoint is read-only; create and management flows currently happen through the mod-side command flow

## Recent Devlogs

Relevant rollout notes for the current API behavior:

- [March 2026 updates](https://sky.coflnet.com/updates/2026/3) - API token docs, copper flips, multi-step fusion flips, Bazaar export rollout, and IP rate-limit blacklisting
- [April 2026 updates](https://sky.coflnet.com/updates/2026/4) - Bazaar export fixes, Premium+ requirements for older detailed bazaar data, and API wiki rate-limit clarifications
- [May 2026 updates](https://sky.coflnet.com/updates/2026/5) - follow-up fixes affecting Bazaar recommendations and filter handling


## Rate Limits
To ensure fair usage of our API, we enforce the following rate limits:

### General API Rate Limits
| Window | Limit | Applies to |
|--------|-------|------------|
| 10 seconds | 30 requests | All users (by IP) |
| 1 minute | 100 requests | All users (by IP) |

Premium+ users with a valid `Authorization: Bearer` token are identified by their account instead of IP and are exempt from IP bans.

### Bazaar Export Rate Limits
| Window | Limit | Notes |
|--------|-------|-------|
| 5 minutes | 5 cost units | Full order book exports cost 3 units, standard exports cost 1 unit |

**Export data access by tier:**
| Tier | Max History | Data Resolution |
|------|------------|----------------|
| Free | — | No export access |
| Premium | 180 days | 20-second increments (last 2 weeks), 5-minute increments |
| Premium+ | Since October 2019 | 20-second increments (last 2 weeks), 5-minute increments (older) |

### Auction Archive Rate Limits
| Endpoint | Rate Limit | Tier Required |
|----------|-----------|---------------|
| `/auctions/tag/{tag}/archive/overview` | 2-second delay per request | Premium+ |
| `/auctions/tag/{tag}/archive/export` | Max 4 queued jobs | Premium+ |
| `/auctions/tag/{tag}/recent/overview` | General API limits | Free |
| `/auctions/tag/{tag}/active/overview` | General API limits | Free |

Archive pagination is only available for Premium+ users.

### Rate Limit Response
If you exceed these limits, you will receive a `429 Too Many Requests` response. Please implement appropriate retry logic in your application to handle rate limiting.
The response headers tell you both how many you have left and when the limit resets:
- `X-RateLimit-Limit`: The maximum number of requests allowed in the current period
- `X-RateLimit-Remaining`: The number of requests remaining in the current period
- `X-RateLimit-Reset`: The time at which the current rate limit window resets

**Blocked?** If your IP has been blocked for exceeding rate limits, you can unblock it with a Premium+ subscription. See [API Access & Token Management](/wiki/api-access) for details.

You can also contact us via discord to request higher rate limits for your application.

## Attribution
If you use our API in your application, please attribute us as the data source.  
A link should be placed on all webpages using our data, linking to either relevant page related or https://sky.coflnet.com/data  
For example:
* For item prices link to `https://sky.coflnet.com/item/{tag}` with text eg `Prices provided by SkyCofl`
* For player data link to `https://sky.coflnet.com/player/{userId}`
* For flips link to the relevant flip page or [`https://sky.coflnet.com/flips`](https://sky.coflnet.com/flips)

### Commercial Use
If you use our API in a commercial product, you are required to also help us fund our servers directly via subscribing to premium+.