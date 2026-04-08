---
title: "Programatic API access"
description: "API access for developers"
order: 10
---

We provide a free API for developers to access most of our data. You can check out the openapi documentation [here](https://sky.coflnet.com/api).

## Player Data
We extract player specific game data via our mod directly from the skyblock to build features with.  
You can get access to this data via our API via endpoints starting with `/api/player/`.  
Data not visible publicly via hypixel apis (like the auctions) requires an api key from the player.  
You (and your users) can get an api key via running `/cofl api` command with our mod.  
That api key can then be passed to the endpoint both
* Via query parameter `?apiKey=YOUR_API_KEY`
* Via header `x-api-key: YOUR_API_KEY`

### Attributes
You can get the players attribute levels via `/api/player/extracted`. Its updated whenever the player opens the huntig box.

### Bazaar Orders
You can get the current bazaar orders of a player via `/api/player/bazaar` endpoint. It contains order size, price and last known fill state.

### Booster Cookie 
You can get the players current booster expiry via `/api/player/extracted`. Its updated whenever the player opens the skyblock menu (so pretty often)

### Composter
You can get the players current composter upgrades and fill state via `/api/player/extracted`

### Heart of the forest
You can get the players current heart of the forest and heart of the mountain level via `/api/player/extracted`

### Missing any data?
If you need any other data that is visible in game, please contact us via discord or email. Alternatively open a pullrequest yourself in the [PlayerState repostiory](https://github.com/Coflnet/SkyPlayerState) which handles the data extraction and storage or the [API repository](https://github.com/Coflnet/SkyApi) which exposes the data.

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


## Rate Limits
To ensure fair usage of our API, we enforce the following rate limits:
- maximum 100 requests per minute
- maximum 30 requests per 10 seconds (to avoid hitting the limit and then having to wait a full minute)

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