---
title: "API Access & Token Management"
description: "Manage your API access, check blacklist status, and learn how to authenticate API requests"
order: 11
---

## API Authentication

If you want to get a lot of data or need to unblock your IP after being rate-limited, you can authenticate your API requests with a **Premium+** subscription.

### Your Token & Blacklist Status

<ApiAccessStatus />

### How to get your token manually

1. Go to [sky.coflnet.com](https://sky.coflnet.com) and log in with Google
2. Open your browser's developer console (F12)
3. Run: `localStorage.getItem('googleId')`
4. Copy the returned string — this is your Account token

### Passing the token

Add the `Authorization` header to your API requests:

**cURL:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" https://sky.coflnet.com/api/bazaar/BOOSTER_COOKIE/snapshot
```

**Python:**
```python
import requests

headers = {"Authorization": "Bearer YOUR_TOKEN"}
response = requests.get(
    "https://sky.coflnet.com/api/bazaar/BOOSTER_COOKIE/snapshot",
    headers=headers
)
print(response.json())
```

**JavaScript:**
```javascript
const response = await fetch(
  "https://sky.coflnet.com/api/bazaar/BOOSTER_COOKIE/snapshot",
  { headers: { "Authorization": "Bearer YOUR_TOKEN" } }
);
const data = await response.json();
console.log(data);
```

### Terms of use

- **Free access:** The API is provided free of charge.
- **Personal use / no redistribution (non-Premium+):** For non-Premium+ users, data obtained via the API is intended for personal use only and may not be redistributed, republished, or resold in any form without explicit permission.
- **Premium+ — expanded usage rights:** Premium+ subscribers are permitted to analyze and use data obtained from any API endpoints (including for commercial purposes) provided that the use does not create a product or service that directly competes with SkyCofl features and an active Premium+ subscription is maintained.
- **Prohibited uses:** Providing the API data as a service, bulk redistribution, or using the data to directly compete with SkyCofl is prohibited unless agreed otherwise.

## IP Blacklist & Unblocking

If you exceed the API rate limits continuously, your IP may be automatically blocked. This can happen from:

- Accumulating too many rate-limit (429) violations — after 500 violations your IP is banned
- Changing IPs frequently to bypass rate limits will get you banned faster
- Please identify yourself in the user-agents, not doing so can get you banned quicker

### How to unblock your IP

1. **Get Premium+** at [sky.coflnet.com/premium](https://sky.coflnet.com/premium)
2. **Pass your token** with API requests using the `Authorization: Bearer` header
3. Your IP will be **automatically unblocked** when the API sees a valid Premium+ token
4. Alternatively, use the unblock button above if you're logged in

### Staying unblocked

- Always include your `Authorization: Bearer` header in requests
- Premium+ users are exempt from IP bans and can just download data directly so don't need to send lots of requests.
- Respect the rate limit headers (`X-RateLimit-Remaining`, `X-RateLimit-Reset`) even with premium


For custom rate limits for your application, contact us on [Discord](https://discord.gg/wvKXSHt).
