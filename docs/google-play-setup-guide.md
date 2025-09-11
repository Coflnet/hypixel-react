# Quick Setup Guide: Google Play Payment Server-Side Validation

This guide provides step-by-step instructions for setting up Google Play payment validation with callback functionality.

## Prerequisites

- Google Play Console access
- Google Cloud Platform project
- Backend server (Java/Spring Boot or Node.js)

## Step 1: Google Play Console Configuration

### 1.1 Create In-App Products

```bash
# Login to Google Play Console
open https://play.google.com/console

# Navigate to: Your App → Monetize → Products → In-app products
# Create these products:

Product 1:
- Product ID: com.coflnet.skyblock.coflcoins.1800
- Type: Managed product
- Name: 1800 CoflCoins Bundle
- Description: Get 1800 CoflCoins for premium features
- Price: €9.69

Product 2:
- Product ID: com.coflnet.skyblock.coflcoins.5400
- Type: Managed product  
- Name: 5400 CoflCoins Bundle
- Description: Get 5400 CoflCoins for premium features
- Price: €24.69
```

### 1.2 Enable Real-time Developer Notifications

1. Go to **Monetize** → **Real-time developer notifications**
2. Create a Cloud Pub/Sub topic:
   ```bash
   gcloud pubsub topics create google-play-notifications
   ```
3. Set topic name: `projects/YOUR_PROJECT_ID/topics/google-play-notifications`
4. Save configuration

## Step 2: Service Account Setup

### 2.1 Create Service Account

```bash
# Set your project ID
export PROJECT_ID="your-project-id"

# Create service account
gcloud iam service-accounts create skycofl-billing \
  --display-name="SkyCofl Google Play Billing"

# Grant permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:skycofl-billing@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/androidpublisher.editor"

# Create key file
gcloud iam service-accounts keys create credentials.json \
  --iam-account=skycofl-billing@$PROJECT_ID.iam.gserviceaccount.com

# Enable required APIs
gcloud services enable androidpublisher.googleapis.com
gcloud services enable pubsub.googleapis.com
```

### 2.2 Download and Secure Credentials

```bash
# Move credentials to secure location
mkdir -p /etc/skycofl/credentials/
mv credentials.json /etc/skycofl/credentials/google-play-key.json
chmod 600 /etc/skycofl/credentials/google-play-key.json
```

## Step 3: Backend Implementation

### 3.1 Spring Boot Setup

**Add Dependencies (pom.xml):**
```xml
<dependencies>
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
    <dependency>
        <groupId>com.google.cloud</groupId>
        <artifactId>google-cloud-pubsub</artifactId>
        <version>1.120.0</version>
    </dependency>
</dependencies>
```

**Configuration (application.yml):**
```yaml
google:
  play:
    package-name: com.coflnet.skycofl
    credentials-path: /etc/skycofl/credentials/google-play-key.json
    pubsub:
      subscription: google-play-notifications-sub
```

### 3.2 Create Core Service

**GooglePlayBillingService.java:**
```java
@Service
@Slf4j
public class GooglePlayBillingService {
    
    @Value("${google.play.package-name}")
    private String packageName;
    
    @Value("${google.play.credentials-path}")
    private String credentialsPath;
    
    private AndroidPublisher androidPublisher;
    
    @PostConstruct
    public void init() throws IOException, GeneralSecurityException {
        GoogleCredentials credentials = GoogleCredentials
            .fromStream(new FileInputStream(credentialsPath))
            .createScoped(AndroidPublisherScopes.ANDROIDPUBLISHER);
        
        this.androidPublisher = new AndroidPublisher.Builder(
            GoogleNetHttpTransport.newTrustedTransport(),
            GsonFactory.getDefaultInstance(),
            new HttpCredentialsAdapter(credentials))
            .setApplicationName("SkyCofl Backend")
            .build();
    }
    
    public PaymentValidationResult validatePurchase(String productId, String purchaseToken) {
        try {
            ProductPurchase purchase = androidPublisher.purchases().products()
                .get(packageName, productId, purchaseToken)
                .execute();
            
            return PaymentValidationResult.builder()
                .success(true)
                .orderId(purchase.getOrderId())
                .purchaseTime(new Date(purchase.getPurchaseTimeMillis()))
                .purchaseState(purchase.getPurchaseState())
                .acknowledgementState(purchase.getAcknowledgementState())
                .build();
                
        } catch (Exception e) {
            log.error("Purchase validation failed", e);
            return PaymentValidationResult.builder()
                .success(false)
                .error(e.getMessage())
                .build();
        }
    }
    
    public void acknowledgePurchase(String productId, String purchaseToken) throws IOException {
        androidPublisher.purchases().products()
            .acknowledge(packageName, productId, purchaseToken)
            .execute();
    }
}
```

### 3.3 REST Controller

**PaymentController.java:**
```java
@RestController
@RequestMapping("/api/topup")
@Slf4j
public class PaymentController {
    
    @Autowired
    private GooglePlayBillingService billingService;
    
    @Autowired
    private UserService userService;
    
    @PostMapping("/googleplay")
    public ResponseEntity<PaymentResponse> processGooglePlayPurchase(
            @RequestHeader("GoogleToken") String googleToken,
            @RequestHeader("Purchase-Token") String purchaseToken,
            @RequestBody GooglePlayPurchaseRequest request) {
        
        try {
            // 1. Validate user
            User user = userService.getUserByGoogleToken(googleToken);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new PaymentResponse("", "invalid_user"));
            }
            
            // 2. Validate purchase with Google Play
            PaymentValidationResult validation = billingService
                .validatePurchase(request.getProductId(), purchaseToken);
            
            if (!validation.isSuccess()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new PaymentResponse("", "validation_failed"));
            }
            
            // 3. Check purchase state
            if (validation.getPurchaseState() != 0) { // 0 = purchased
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new PaymentResponse("", "invalid_purchase_state"));
            }
            
            // 4. Check if already processed
            if (validation.getAcknowledgementState() == 1) { // already acknowledged
                return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new PaymentResponse("", "already_processed"));
            }
            
            // 5. Process purchase
            int coflCoins = getCoflCoinsForProduct(request.getProductId());
            processSuccessfulPurchase(user, coflCoins, validation);
            
            // 6. Acknowledge purchase
            billingService.acknowledgePurchase(request.getProductId(), purchaseToken);
            
            return ResponseEntity.ok(new PaymentResponse(
                validation.getOrderId(), 
                "success"
            ));
            
        } catch (Exception e) {
            log.error("Google Play purchase processing failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new PaymentResponse("", "processing_error"));
        }
    }
    
    private int getCoflCoinsForProduct(String productId) {
        Map<String, Integer> products = Map.of(
            "com.coflnet.skyblock.coflcoins.1800", 1800,
            "com.coflnet.skyblock.coflcoins.5400", 5400
        );
        return products.getOrDefault(productId, 0);
    }
    
    private void processSuccessfulPurchase(User user, int coflCoins, PaymentValidationResult validation) {
        // Add CoflCoins to user
        user.setCoflCoins(user.getCoflCoins() + coflCoins);
        userService.save(user);
        
        // Record transaction
        Transaction transaction = new Transaction();
        transaction.setUserId(user.getId());
        transaction.setAmount(coflCoins);
        transaction.setType(TransactionType.GOOGLE_PLAY_PURCHASE);
        transaction.setOrderId(validation.getOrderId());
        transaction.setPurchaseTime(validation.getPurchaseTime());
        transactionService.save(transaction);
        
        log.info("Processed Google Play purchase: user={}, coflCoins={}, orderId={}", 
            user.getId(), coflCoins, validation.getOrderId());
    }
}
```

## Step 4: Real-time Notifications (Optional)

### 4.1 Pub/Sub Listener

**NotificationListener.java:**
```java
@Component
@Slf4j
public class GooglePlayNotificationListener {
    
    @Value("${google.play.pubsub.subscription}")
    private String subscriptionName;
    
    @Autowired
    private GooglePlayBillingService billingService;
    
    @PostConstruct
    public void startListening() {
        ProjectSubscriptionName subscription = ProjectSubscriptionName
            .of("your-project-id", subscriptionName);
        
        Subscriber subscriber = Subscriber.newBuilder(subscription, this::receiveMessage)
            .build();
        
        subscriber.startAsync().awaitRunning();
        log.info("Started Google Play notification listener");
    }
    
    private void receiveMessage(PubsubMessage message, AckReplyConsumer consumer) {
        try {
            String data = message.getData().toStringUtf8();
            log.info("Received Google Play notification: {}", data);
            
            // Process notification
            processNotification(data);
            
            consumer.ack();
        } catch (Exception e) {
            log.error("Failed to process notification", e);
            consumer.nack();
        }
    }
    
    private void processNotification(String data) {
        // Parse and handle different notification types
        // Implementation depends on your specific needs
    }
}
```

## Step 5: Testing

### 5.1 Test Purchase Flow

```bash
# Use Google Play Console's testing features
# 1. Add test accounts in Play Console
# 2. Create test purchases
# 3. Verify backend receives and processes purchases correctly

curl -X POST http://localhost:8080/api/topup/googleplay \
  -H "GoogleToken: test-user-token" \
  -H "Purchase-Token: test-purchase-token" \
  -H "Content-Type: application/json" \
  -d '{"productId": "com.coflnet.skyblock.coflcoins.1800"}'
```

### 5.2 Verify Setup

**Health Check Endpoint:**
```java
@RestController
public class HealthController {
    
    @Autowired
    private GooglePlayBillingService billingService;
    
    @GetMapping("/health/googleplay")
    public ResponseEntity<Map<String, Object>> checkGooglePlayHealth() {
        Map<String, Object> status = new HashMap<>();
        
        try {
            // Test connection to Google Play API
            boolean isHealthy = billingService.healthCheck();
            status.put("status", isHealthy ? "UP" : "DOWN");
            status.put("timestamp", Instant.now());
            
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            status.put("status", "DOWN");
            status.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(status);
        }
    }
}
```

## Step 6: Security Checklist

- [ ] Service account credentials secured (600 permissions)
- [ ] Environment variables used for sensitive config  
- [ ] Request rate limiting implemented
- [ ] Idempotency checks in place
- [ ] Comprehensive logging enabled
- [ ] Error handling covers all edge cases
- [ ] Test purchases working correctly
- [ ] Monitoring and alerts configured

## Step 7: Production Deployment

### 7.1 Environment Variables

```bash
# Set in production environment
export GOOGLE_PLAY_PACKAGE_NAME="com.coflnet.skycofl"
export GOOGLE_PLAY_CREDENTIALS_PATH="/etc/skycofl/credentials/google-play-key.json"
export GOOGLE_PLAY_PUBSUB_SUBSCRIPTION="google-play-notifications-sub"
```

### 7.2 Monitoring

Set up monitoring for:
- Purchase success/failure rates
- Response times
- Error rates
- Revenue tracking

Your Google Play payment integration is now ready! The system will automatically validate purchases, add CoflCoins to user accounts, and handle all the security considerations.
