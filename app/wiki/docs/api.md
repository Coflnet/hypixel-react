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


## Rate Limits
To ensure fair usage of our API, we enforce the following rate limits:
- maximum 100 requests per minute
- maximum 30 requests per 10 seconds (to avoid hitting the limit and then having to wait a full minute)

If you exceed these limits, you will receive a `429 Too Many Requests` response. Please implement appropriate retry logic in your application to handle rate limiting.
The response headers tell you both how many you have left and when the limit resets:
- `X-RateLimit-Limit`: The maximum number of requests allowed in the current period
- `X-RateLimit-Remaining`: The number of requests remaining in the current period
- `X-RateLimit-Reset`: The time at which the current rate limit window resets

## Attribution
If you use our API in your application, please attribute us as the data source.  
A link should be placed on all webpages using our data, linking to either relevant page related or https://sky.coflnet.com/data  
For example:
* For item prices link to `https://sky.coflnet.com/item/{tag}` with text eg `Prices provided by SkyCofl`
* For player data link to `https://sky.coflnet.com/player/{userId}`
* For flips link to the relevant flip page or [`https://sky.coflnet.com/flips`](https://sky.coflnet.com/flips)

### Commercial Use
If you use our API in a commercial product, you are required to also help us fund our servers directly via subscribing to premium+.