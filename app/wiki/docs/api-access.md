---
title: "API Access & Token Management"
description: "Manage your API access, check blacklist status, and learn how to authenticate API requests"
order: 11
---

## API Authentication

If you want higher rate limits or need to unblock your IP after being rate-limited, you can authenticate your API requests with a **Premium+** subscription.

### Your Token & Blacklist Status

<ApiAccessStatus />

### How to get your token manually

1. Go to [sky.coflnet.com](https://sky.coflnet.com) and log in with Google
2. Open your browser's developer console (F12)
3. Run: `localStorage.getItem('googleId')`
4. Copy the returned string — this is your API token

### Passing the token

Add the `Authorization` header to your API requests:

**cURL:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" https://sky.coflnet.com/api/bazaar/GOLD_BLOCK/snapshot
```

**Python:**
```python
import requests

headers = {"Authorization": "Bearer YOUR_TOKEN"}
response = requests.get(
    "https://sky.coflnet.com/api/bazaar/GOLD_BLOCK/snapshot",
    headers=headers
)
print(response.json())
```

**JavaScript:**
```javascript
const response = await fetch(
  "https://sky.coflnet.com/api/bazaar/GOLD_BLOCK/snapshot",
  { headers: { "Authorization": "Bearer YOUR_TOKEN" } }
);
const data = await response.json();
console.log(data);
```

## IP Blacklist & Unblocking

If you exceed the API rate limits continuously, your IP may be automatically blocked. This can happen from:

- Accumulating too many rate-limit (429) violations — after 500 violations your IP is permanently banned
- Using known scraping user-agents (`python-requests`, `go-http-client`, `axios`, `node-fetch`) or an empty User-Agent — these incur penalty points that accelerate banning
- Running a distributed proxy pool — if 5+ IPs from the same /24 subnet send over 400 requests/minute, the entire subnet is banned
- Subnet-level bans trigger after 3000 combined violations across all IPs in the same /24 (IPv4) or /48 (IPv6) subnet

### How to unblock your IP

1. **Get Premium+** at [sky.coflnet.com/premium](https://sky.coflnet.com/premium)
2. **Pass your token** with API requests using the `Authorization: Bearer` header
3. Your IP will be **automatically unblocked** when the API sees a valid Premium+ token
4. Alternatively, use the unblock button above if you're logged in

### Staying unblocked

- Always include your `Authorization: Bearer` header in requests
- Premium+ users get higher rate limits and are exempt from IP bans
- Respect the rate limit headers (`X-RateLimit-Remaining`, `X-RateLimit-Reset`) even with premium

## Rate Limits

| Tier | Requests per 10s | Requests per minute |
|------|-------------------|---------------------|
| Free | 30 | 100 |
| Premium+ (with token) | Bypasses IP limits | Bypasses IP limits |

For custom rate limits for your application, contact us on [Discord](https://discord.gg/wvKXSHt).
