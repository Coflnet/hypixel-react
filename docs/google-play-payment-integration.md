# Google Play Store Payment Integration

This document provides a comprehensive guide for implementing Google Play Store payment validation for CoflCoins purchases in the PWA/TWA version of SkyCofl.

## Overview

The Google Play Store integration allows users who have installed the SkyCofl PWA from the Google Play Store to purchase CoflCoins using Google Play Billing. This provides a seamless, secure payment experience using Google's trusted payment infrastructure.

## Product Configuration

### Google Play Console Setup

1. **Create In-App Products**
   - Log into [Google Play Console](https://play.google.com/console)
   - Navigate to your app → Monetize → Products → In-app products
   - Create the following products:

   ```
   Product ID: com.coflnet.skyblock.coflcoins.1800
   Product Type: Managed product (one-time purchase)
   Name: 1800 CoflCoins
   Description: Get 1800 CoflCoins for SkyCofl premium features
   Price: €9.69
   ```

   ```
   Product ID: com.coflnet.skyblock.coflcoins.5400
   Product Type: Managed product (one-time purchase)  
   Name: 5400 CoflCoins
   Description: Get 5400 CoflCoins for SkyCofl premium features
   Price: €24.69
   ```

2. **Enable Real-time Developer Notifications**
   - Go to Monetize → Real-time developer notifications
   - Set up Cloud Pub/Sub topic for purchase notifications
   - Configure notification settings

### Service Account Setup

1. **Create Service Account**
   ```bash
   # Create service account in Google Cloud Console
   gcloud iam service-accounts create skycofl-billing \
     --display-name="SkyCofl Billing Service Account"
   
   # Grant necessary permissions
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
     --member="serviceAccount:skycofl-billing@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/androidpublisher.editor"
   
   # Create and download key
   gcloud iam service-accounts keys create skycofl-billing-key.json \
     --iam-account=skycofl-billing@YOUR_PROJECT_ID.iam.gserviceaccount.com
   ```

2. **Enable APIs**
   ```bash
   gcloud services enable androidpublisher.googleapis.com
   gcloud services enable pubsub.googleapis.com
   ```

## Backend Implementation

### Dependencies

Add the following to your backend dependencies:

```xml
<!-- For Java/Spring Boot -->
<dependency>
    <groupId>com.google.apis</groupId>
    <artifactId>google-api-services-androidpublisher</artifactId>
    <version>v3-rev20230327-2.0.0</version>
</dependency>
<dependency>
    <groupId>com.google.auth</groupId>
    <artifactId>google-auth-library-oauth2-http</artifactId>
    <version>1.17.0</version>
</dependency>
```

```json
// For Node.js
{
  "googleapis": "^118.0.0",
  "google-auth-library": "^8.8.0"
}
```

### Purchase Validation Service

#### Java Implementation

```java
@Service
public class GooglePlayBillingService {
    
    private final AndroidPublisher androidPublisher;
    private final String packageName = "com.coflnet.skycofl";
    
    @Autowired
    public GooglePlayBillingService() throws IOException, GeneralSecurityException {
        GoogleCredentials credentials = GoogleCredentials
            .fromStream(new FileInputStream("path/to/skycofl-billing-key.json"))
            .createScoped(AndroidPublisherScopes.ANDROIDPUBLISHER);
        
        this.androidPublisher = new AndroidPublisher.Builder(
            GoogleNetHttpTransport.newTrustedTransport(),
            GsonFactory.getDefaultInstance(),
            new HttpCredentialsAdapter(credentials))
            .setApplicationName("SkyCofl Backend")
            .build();
    }
    
    @PostMapping("/api/topup/googleplay")
    public ResponseEntity<PaymentResponse> validateGooglePlayPurchase(
            @RequestHeader("GoogleToken") String googleToken,
            @RequestHeader("Purchase-Token") String purchaseToken,
            @RequestBody GooglePlayPurchaseRequest request) {
        
        try {
            // Validate the purchase with Google Play
            ProductPurchase purchase = androidPublisher.purchases().products()
                .get(packageName, request.getProductId(), purchaseToken)
                .execute();
            
            // Verify purchase state
            if (purchase.getPurchaseState() != 0) { // 0 = purchased
                throw new IllegalStateException("Purchase not in valid state: " + purchase.getPurchaseState());
            }
            
            // Check if already acknowledged/consumed
            if (purchase.getAcknowledgementState() == 1) { // 1 = acknowledged
                throw new IllegalStateException("Purchase already acknowledged");
            }
            
            // Verify the product matches expected CoflCoin amounts
            int coflCoinsAmount = getCoflCoinsForProduct(request.getProductId());
            if (coflCoinsAmount == 0) {
                throw new IllegalArgumentException("Invalid product ID: " + request.getProductId());
            }
            
            // Process the purchase in your system
            processPurchase(googleToken, coflCoinsAmount, purchase);
            
            // Acknowledge the purchase
            androidPublisher.purchases().products()
                .acknowledge(packageName, request.getProductId(), purchaseToken)
                .execute();
            
            return ResponseEntity.ok(new PaymentResponse(
                purchase.getOrderId(),
                "success"
            ));
            
        } catch (Exception e) {
            log.error("Failed to validate Google Play purchase", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new PaymentResponse("", "validation_failed"));
        }
    }
    
    private int getCoflCoinsForProduct(String productId) {
        switch (productId) {
            case "com.coflnet.skyblock.coflcoins.1800":
                return 1800;
            case "com.coflnet.skyblock.coflcoins.5400":
                return 5400;
            default:
                return 0;
        }
    }
    
    private void processPurchase(String googleToken, int coflCoinsAmount, ProductPurchase purchase) {
        // 1. Verify user exists and is valid
        User user = userService.getUserByGoogleToken(googleToken);
        if (user == null) {
            throw new IllegalArgumentException("Invalid user token");
        }
        
        // 2. Check for duplicate purchases (idempotency)
        if (transactionService.existsByOrderId(purchase.getOrderId())) {
            throw new IllegalStateException("Purchase already processed");
        }
        
        // 3. Add CoflCoins to user account
        user.setCoflCoins(user.getCoflCoins() + coflCoinsAmount);
        userService.save(user);
        
        // 4. Record transaction
        Transaction transaction = new Transaction();
        transaction.setUserId(user.getId());
        transaction.setAmount(coflCoinsAmount);
        transaction.setType(TransactionType.GOOGLE_PLAY_PURCHASE);
        transaction.setOrderId(purchase.getOrderId());
        transaction.setPurchaseTime(new Date(purchase.getPurchaseTimeMillis()));
        transactionService.save(transaction);
        
        // 5. Log for audit
        auditService.logPurchase(user.getId(), coflCoinsAmount, "google_play", purchase.getOrderId());
    }
}
```

#### Node.js Implementation

```javascript
const { google } = require('googleapis');
const fs = require('fs');

class GooglePlayBillingService {
  constructor() {
    const keyFile = JSON.parse(fs.readFileSync('path/to/skycofl-billing-key.json'));
    
    this.auth = new google.auth.GoogleAuth({
      credentials: keyFile,
      scopes: ['https://www.googleapis.com/auth/androidpublisher']
    });
    
    this.androidpublisher = google.androidpublisher('v3');
    this.packageName = 'com.coflnet.skycofl';
  }
  
  async validatePurchase(productId, purchaseToken, googleToken) {
    try {
      const authClient = await this.auth.getClient();
      
      // Get purchase details from Google Play
      const response = await this.androidpublisher.purchases.products.get({
        auth: authClient,
        packageName: this.packageName,
        productId: productId,
        token: purchaseToken
      });
      
      const purchase = response.data;
      
      // Validate purchase state
      if (purchase.purchaseState !== 0) {
        throw new Error(`Invalid purchase state: ${purchase.purchaseState}`);
      }
      
      // Check if already acknowledged
      if (purchase.acknowledgementState === 1) {
        throw new Error('Purchase already acknowledged');
      }
      
      // Get CoflCoins amount for product
      const coflCoinsAmount = this.getCoflCoinsForProduct(productId);
      if (!coflCoinsAmount) {
        throw new Error(`Invalid product ID: ${productId}`);
      }
      
      // Process purchase in your system
      await this.processPurchase(googleToken, coflCoinsAmount, purchase);
      
      // Acknowledge the purchase
      await this.androidpublisher.purchases.products.acknowledge({
        auth: authClient,
        packageName: this.packageName,
        productId: productId,
        token: purchaseToken
      });
      
      return {
        id: purchase.orderId,
        directLink: 'success'
      };
      
    } catch (error) {
      console.error('Google Play purchase validation failed:', error);
      throw error;
    }
  }
  
  getCoflCoinsForProduct(productId) {
    const products = {
      'com.coflnet.skyblock.coflcoins.1800': 1800,
      'com.coflnet.skyblock.coflcoins.5400': 5400
    };
    
    return products[productId] || 0;
  }
  
  async processPurchase(googleToken, coflCoinsAmount, purchase) {
    // Implementation similar to Java version
    // 1. Verify user
    // 2. Check for duplicates
    // 3. Add CoflCoins
    // 4. Record transaction
    // 5. Audit log
  }
}

// Express route handler
app.post('/api/topup/googleplay', async (req, res) => {
  try {
    const googleToken = req.headers['googletoken'];
    const purchaseToken = req.headers['purchase-token'];
    const { productId } = req.body;
    
    const billingService = new GooglePlayBillingService();
    const result = await billingService.validatePurchase(productId, purchaseToken, googleToken);
    
    res.json(result);
    
  } catch (error) {
    console.error('Purchase validation error:', error);
    res.status(400).json({ error: 'Purchase validation failed' });
  }
});
```

## Real-time Notifications

### Pub/Sub Setup

```javascript
// Handle real-time developer notifications
const { PubSub } = require('@google-cloud/pubsub');

const pubsub = new PubSub();
const subscription = pubsub.subscription('google-play-notifications');

subscription.on('message', async (message) => {
  try {
    const data = JSON.parse(message.data.toString());
    
    if (data.subscriptionNotification) {
      // Handle subscription events (if using subscriptions)
      await handleSubscriptionNotification(data.subscriptionNotification);
    } else if (data.oneTimeProductNotification) {
      // Handle one-time product purchase events
      await handleProductNotification(data.oneTimeProductNotification);
    }
    
    message.ack();
  } catch (error) {
    console.error('Failed to process notification:', error);
    message.nack();
  }
});

async function handleProductNotification(notification) {
  const { notificationType, purchaseToken, sku } = notification;
  
  switch (notificationType) {
    case 1: // PURCHASED
      console.log(`Product purchased: ${sku}, token: ${purchaseToken}`);
      break;
    case 2: // CANCELED
      console.log(`Product canceled: ${sku}, token: ${purchaseToken}`);
      // Handle refund logic
      break;
  }
}
```

## Security Considerations

### Request Validation

1. **Always validate purchase tokens server-side**
2. **Implement idempotency checks** to prevent duplicate processing
3. **Verify user authentication** before processing purchases
4. **Rate limit** purchase endpoints
5. **Log all transactions** for audit purposes

### Error Handling

```java
@ExceptionHandler(GooglePlayValidationException.class)
public ResponseEntity<ErrorResponse> handleGooglePlayError(GooglePlayValidationException e) {
    log.error("Google Play validation error", e);
    
    ErrorResponse error = new ErrorResponse();
    error.setMessage("Purchase validation failed");
    error.setCode("GOOGLE_PLAY_ERROR");
    
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
}
```

## Testing

### Test Environment

1. **Use Google Play Console's testing features**
2. **Create test accounts** for internal testing
3. **Test with sandbox purchases** before going live

### Integration Tests

```java
@Test
public void testGooglePlayPurchaseValidation() {
    // Mock Google Play API response
    ProductPurchase mockPurchase = new ProductPurchase();
    mockPurchase.setPurchaseState(0);
    mockPurchase.setAcknowledgementState(0);
    mockPurchase.setOrderId("test-order-123");
    
    // Test validation
    PaymentResponse response = billingService.validateGooglePlayPurchase(
        "test-google-token", 
        "test-purchase-token", 
        new GooglePlayPurchaseRequest("com.coflnet.skyblock.coflcoins.1800")
    );
    
    assertThat(response.getId()).isEqualTo("test-order-123");
}
```

## Monitoring and Analytics

### Key Metrics to Track

1. **Purchase success rate**
2. **Refund rate**
3. **Revenue by product**
4. **User conversion rates**

### Implementation

```java
@Component
public class PurchaseMetrics {
    
    private final MeterRegistry meterRegistry;
    private final Counter purchaseSuccessCounter;
    private final Counter purchaseFailureCounter;
    
    public PurchaseMetrics(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
        this.purchaseSuccessCounter = Counter.builder("purchases.success")
            .description("Successful purchases")
            .tag("platform", "google_play")
            .register(meterRegistry);
        this.purchaseFailureCounter = Counter.builder("purchases.failure")
            .description("Failed purchases")
            .tag("platform", "google_play")
            .register(meterRegistry);
    }
    
    public void recordSuccessfulPurchase(String productId, double amount) {
        purchaseSuccessCounter.increment(Tags.of("product", productId));
        Gauge.builder("revenue.total")
            .description("Total revenue")
            .register(meterRegistry, this, metrics -> getCurrentRevenue());
    }
}
```

## Troubleshooting

### Common Issues

1. **"Purchase already acknowledged"**
   - Check for duplicate processing
   - Implement proper idempotency

2. **"Invalid purchase token"**
   - Verify token is passed correctly from frontend
   - Check token expiration

3. **"Insufficient permissions"**
   - Verify service account has correct roles
   - Check API is enabled

### Debug Logging

```java
@Configuration
@Profile("development")
public class GooglePlayDebugConfig {
    
    @Bean
    public HttpRequestInitializer debugHttpRequestInitializer() {
        return request -> {
            request.setLoggingEnabled(true);
            request.setCurlLoggingEnabled(true);
        };
    }
}
```

This comprehensive guide should provide everything needed to implement Google Play Store payment validation on the backend, including security considerations, testing strategies, and monitoring capabilities.
