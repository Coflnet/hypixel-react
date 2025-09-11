# Google Play Payment Callback Implementation

This document describes how to implement callback-based validation for Google Play payments, including webhook endpoints and real-time notification handling.

## Overview

Callback-based validation provides a more robust payment processing system by:
- Handling purchases that might be initiated outside the app
- Providing redundancy for payment validation
- Enabling real-time purchase notifications
- Supporting refund and cancellation handling

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │  Google Play    │
│   (PWA/TWA)     │    │   Server        │    │   Console       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │ 1. Initiate Purchase   │                       │
         │──────────────────────→ │                       │
         │                       │ 2. Validate Purchase  │
         │                       │──────────────────────→ │
         │                       │ ← 3. Purchase Details │
         │                       │                       │
         │                       │ ← 4. Real-time Notification
         │                       │                       │
         │ ← 5. Purchase Result   │                       │
         │                       │                       │
```

## Webhook Endpoints

### 1. Purchase Validation Callback

**Endpoint:** `POST /api/callbacks/googleplay/purchase`

```java
@RestController
@RequestMapping("/api/callbacks/googleplay")
@Slf4j
public class GooglePlayCallbackController {
    
    @Autowired
    private GooglePlayBillingService billingService;
    
    @Autowired
    private CallbackValidationService validationService;
    
    @PostMapping("/purchase")
    public ResponseEntity<CallbackResponse> handlePurchaseCallback(
            @RequestBody GooglePlayCallbackRequest request,
            @RequestHeader(value = "X-Signature", required = false) String signature,
            HttpServletRequest httpRequest) {
        
        try {
            // 1. Validate callback authenticity
            if (!validationService.validateCallback(request, signature, httpRequest)) {
                log.warn("Invalid callback signature received");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new CallbackResponse("invalid_signature"));
            }
            
            // 2. Process the purchase
            PurchaseProcessingResult result = billingService
                .processCallbackPurchase(request);
            
            if (result.isSuccess()) {
                return ResponseEntity.ok(new CallbackResponse("success", result.getOrderId()));
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new CallbackResponse("processing_failed", result.getError()));
            }
            
        } catch (Exception e) {
            log.error("Callback processing failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new CallbackResponse("internal_error"));
        }
    }
    
    @PostMapping("/refund")
    public ResponseEntity<CallbackResponse> handleRefundCallback(
            @RequestBody GooglePlayRefundRequest request,
            @RequestHeader(value = "X-Signature", required = false) String signature) {
        
        try {
            // Process refund
            RefundProcessingResult result = billingService.processRefund(request);
            
            if (result.isSuccess()) {
                return ResponseEntity.ok(new CallbackResponse("refund_processed"));
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new CallbackResponse("refund_failed", result.getError()));
            }
            
        } catch (Exception e) {
            log.error("Refund callback processing failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new CallbackResponse("internal_error"));
        }
    }
}
```

### 2. Real-time Developer Notifications

**Pub/Sub Message Handler:**

```java
@Component
@Slf4j
public class GooglePlayRealTimeNotificationHandler {
    
    @Autowired
    private GooglePlayBillingService billingService;
    
    @Autowired
    private UserService userService;
    
    @EventListener
    public void handleDeveloperNotification(GooglePlayNotificationEvent event) {
        try {
            DeveloperNotification notification = event.getNotification();
            
            if (notification.getOneTimeProductNotification() != null) {
                handleProductNotification(notification.getOneTimeProductNotification());
            } else if (notification.getSubscriptionNotification() != null) {
                handleSubscriptionNotification(notification.getSubscriptionNotification());
            }
            
        } catch (Exception e) {
            log.error("Failed to process real-time notification", e);
        }
    }
    
    private void handleProductNotification(OneTimeProductNotification notification) {
        String purchaseToken = notification.getPurchaseToken();
        String sku = notification.getSku();
        int notificationType = notification.getNotificationType();
        
        log.info("Product notification: type={}, sku={}, token={}", 
            notificationType, sku, purchaseToken);
        
        switch (notificationType) {
            case 1: // PURCHASED
                handlePurchaseNotification(sku, purchaseToken);
                break;
            case 2: // CANCELED
                handleCancellationNotification(sku, purchaseToken);
                break;
            default:
                log.warn("Unknown notification type: {}", notificationType);
        }
    }
    
    private void handlePurchaseNotification(String sku, String purchaseToken) {
        try {
            // Validate and process the purchase
            PaymentValidationResult validation = billingService
                .validatePurchaseByToken(sku, purchaseToken);
            
            if (validation.isSuccess() && validation.getPurchaseState() == 0) {
                // Find user by purchase details or create a pending transaction
                processPurchaseFromNotification(sku, purchaseToken, validation);
            }
            
        } catch (Exception e) {
            log.error("Failed to process purchase notification", e);
        }
    }
    
    private void handleCancellationNotification(String sku, String purchaseToken) {
        try {
            // Find the original transaction
            Transaction transaction = transactionService
                .findByPurchaseToken(purchaseToken);
            
            if (transaction != null) {
                // Reverse the CoflCoins
                User user = userService.getUserById(transaction.getUserId());
                int coflCoinsToDeduct = getCoflCoinsForProduct(sku);
                
                if (user.getCoflCoins() >= coflCoinsToDeduct) {
                    user.setCoflCoins(user.getCoflCoins() - coflCoinsToDeduct);
                    userService.save(user);
                    
                    // Mark transaction as refunded
                    transaction.setStatus(TransactionStatus.REFUNDED);
                    transaction.setRefundTime(new Date());
                    transactionService.save(transaction);
                    
                    log.info("Processed refund: user={}, coflCoins={}, orderId={}", 
                        user.getId(), coflCoinsToDeduct, transaction.getOrderId());
                }
            }
            
        } catch (Exception e) {
            log.error("Failed to process cancellation notification", e);
        }
    }
}
```

## Callback Security

### 1. Signature Validation

```java
@Service
public class CallbackValidationService {
    
    @Value("${google.play.webhook.secret}")
    private String webhookSecret;
    
    public boolean validateCallback(GooglePlayCallbackRequest request, 
                                  String signature, 
                                  HttpServletRequest httpRequest) {
        
        if (signature == null || signature.isEmpty()) {
            return false;
        }
        
        try {
            // Get raw request body
            String requestBody = getRequestBody(httpRequest);
            
            // Calculate expected signature
            String expectedSignature = calculateHMACSHA256(requestBody, webhookSecret);
            
            // Compare signatures
            return MessageDigest.isEqual(
                signature.getBytes(StandardCharsets.UTF_8),
                expectedSignature.getBytes(StandardCharsets.UTF_8)
            );
            
        } catch (Exception e) {
            log.error("Signature validation failed", e);
            return false;
        }
    }
    
    private String calculateHMACSHA256(String data, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKey = new SecretKeySpec(
            secret.getBytes(StandardCharsets.UTF_8), 
            "HmacSHA256"
        );
        mac.init(secretKey);
        
        byte[] hashBytes = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return Base64.getEncoder().encodeToString(hashBytes);
    }
    
    private String getRequestBody(HttpServletRequest request) throws IOException {
        StringBuilder buffer = new StringBuilder();
        String line;
        
        try (BufferedReader reader = request.getReader()) {
            while ((line = reader.readLine()) != null) {
                buffer.append(line);
            }
        }
        
        return buffer.toString();
    }
}
```

### 2. IP Whitelist Validation

```java
@Component
public class GooglePlayIPValidator {
    
    // Google Play's IP ranges (update as needed)
    private static final List<String> GOOGLE_PLAY_IP_RANGES = Arrays.asList(
        "35.186.160.0/20",
        "35.186.176.0/20",
        "35.186.192.0/20"
    );
    
    public boolean isValidGooglePlayIP(String clientIP) {
        try {
            InetAddress clientAddress = InetAddress.getByName(clientIP);
            
            for (String range : GOOGLE_PLAY_IP_RANGES) {
                if (isIPInRange(clientAddress, range)) {
                    return true;
                }
            }
            
            return false;
            
        } catch (Exception e) {
            log.error("IP validation failed", e);
            return false;
        }
    }
    
    private boolean isIPInRange(InetAddress ip, String cidr) throws Exception {
        String[] parts = cidr.split("/");
        InetAddress network = InetAddress.getByName(parts[0]);
        int prefixLength = Integer.parseInt(parts[1]);
        
        byte[] ipBytes = ip.getAddress();
        byte[] networkBytes = network.getAddress();
        
        int bytesToCheck = prefixLength / 8;
        int bitsToCheck = prefixLength % 8;
        
        // Check full bytes
        for (int i = 0; i < bytesToCheck; i++) {
            if (ipBytes[i] != networkBytes[i]) {
                return false;
            }
        }
        
        // Check remaining bits
        if (bitsToCheck > 0 && bytesToCheck < ipBytes.length) {
            int mask = 0xFF << (8 - bitsToCheck);
            return (ipBytes[bytesToCheck] & mask) == (networkBytes[bytesToCheck] & mask);
        }
        
        return true;
    }
}
```

## Idempotency Handling

### 1. Duplicate Purchase Prevention

```java
@Service
@Transactional
public class PurchaseIdempotencyService {
    
    @Autowired
    private TransactionRepository transactionRepository;
    
    @Autowired
    private IdempotencyKeyRepository idempotencyRepository;
    
    public boolean isAlreadyProcessed(String orderId, String purchaseToken) {
        return transactionRepository.existsByOrderIdOrPurchaseToken(orderId, purchaseToken);
    }
    
    public Transaction processWithIdempotency(String idempotencyKey, 
                                            Supplier<Transaction> processor) {
        
        // Check if already processed
        Optional<IdempotencyRecord> existing = idempotencyRepository
            .findByKey(idempotencyKey);
        
        if (existing.isPresent()) {
            // Return existing transaction
            return transactionRepository.findById(existing.get().getTransactionId())
                .orElseThrow(() -> new IllegalStateException("Transaction not found"));
        }
        
        // Process new transaction
        Transaction transaction = processor.get();
        
        // Store idempotency record
        IdempotencyRecord record = new IdempotencyRecord();
        record.setKey(idempotencyKey);
        record.setTransactionId(transaction.getId());
        record.setCreatedAt(new Date());
        idempotencyRepository.save(record);
        
        return transaction;
    }
}
```

## Error Handling and Retry Logic

### 1. Retry Configuration

```java
@Configuration
@EnableRetry
public class GooglePlayRetryConfig {
    
    @Bean
    public RetryTemplate googlePlayRetryTemplate() {
        RetryTemplate retryTemplate = new RetryTemplate();
        
        FixedBackOffPolicy backOffPolicy = new FixedBackOffPolicy();
        backOffPolicy.setBackOffPeriod(2000); // 2 seconds
        retryTemplate.setBackOffPolicy(backOffPolicy);
        
        SimpleRetryPolicy retryPolicy = new SimpleRetryPolicy();
        retryPolicy.setMaxAttempts(3);
        retryTemplate.setRetryPolicy(retryPolicy);
        
        return retryTemplate;
    }
}

@Service
public class ResilientGooglePlayService {
    
    @Autowired
    private RetryTemplate googlePlayRetryTemplate;
    
    @Autowired
    private GooglePlayBillingService billingService;
    
    public PaymentValidationResult validateWithRetry(String productId, String purchaseToken) {
        return googlePlayRetryTemplate.execute(context -> {
            log.info("Attempting purchase validation, attempt: {}", context.getRetryCount() + 1);
            return billingService.validatePurchase(productId, purchaseToken);
        });
    }
}
```

### 2. Circuit Breaker

```java
@Component
public class GooglePlayCircuitBreaker {
    
    private final CircuitBreaker circuitBreaker;
    
    public GooglePlayCircuitBreaker() {
        this.circuitBreaker = CircuitBreaker.ofDefaults("googlePlayBilling");
        
        circuitBreaker.getEventPublisher()
            .onStateTransition(event -> 
                log.info("Circuit breaker state transition: {}", event));
    }
    
    public <T> T executeWithCircuitBreaker(Supplier<T> supplier) {
        return circuitBreaker.executeSupplier(supplier);
    }
}
```

## Monitoring and Observability

### 1. Metrics Collection

```java
@Component
public class GooglePlayMetrics {
    
    private final Counter purchaseAttempts;
    private final Counter purchaseSuccesses;
    private final Counter purchaseFailures;
    private final Timer validationTime;
    
    public GooglePlayMetrics(MeterRegistry meterRegistry) {
        this.purchaseAttempts = Counter.builder("googleplay.purchase.attempts")
            .description("Total purchase attempts")
            .register(meterRegistry);
            
        this.purchaseSuccesses = Counter.builder("googleplay.purchase.successes")
            .description("Successful purchases")
            .register(meterRegistry);
            
        this.purchaseFailures = Counter.builder("googleplay.purchase.failures")
            .description("Failed purchases")
            .register(meterRegistry);
            
        this.validationTime = Timer.builder("googleplay.validation.time")
            .description("Purchase validation time")
            .register(meterRegistry);
    }
    
    public void recordPurchaseAttempt() {
        purchaseAttempts.increment();
    }
    
    public void recordPurchaseSuccess(String productId) {
        purchaseSuccesses.increment(Tags.of("product", productId));
    }
    
    public void recordPurchaseFailure(String error) {
        purchaseFailures.increment(Tags.of("error", error));
    }
    
    public Timer.Sample startValidationTimer() {
        return Timer.start();
    }
    
    public void recordValidationTime(Timer.Sample sample) {
        sample.stop(validationTime);
    }
}
```

### 2. Health Checks

```java
@Component
public class GooglePlayHealthIndicator implements HealthIndicator {
    
    @Autowired
    private GooglePlayBillingService billingService;
    
    @Override
    public Health health() {
        try {
            boolean isHealthy = billingService.performHealthCheck();
            
            if (isHealthy) {
                return Health.up()
                    .withDetail("status", "Google Play API accessible")
                    .withDetail("timestamp", Instant.now())
                    .build();
            } else {
                return Health.down()
                    .withDetail("status", "Google Play API not accessible")
                    .withDetail("timestamp", Instant.now())
                    .build();
            }
            
        } catch (Exception e) {
            return Health.down()
                .withDetail("status", "Health check failed")
                .withDetail("error", e.getMessage())
                .withDetail("timestamp", Instant.now())
                .build();
        }
    }
}
```

## Testing Callbacks

### 1. Mock Callback Server

```java
@TestConfiguration
public class MockGooglePlayCallbackServer {
    
    @Bean
    @Primary
    public GooglePlayBillingService mockBillingService() {
        return Mockito.mock(GooglePlayBillingService.class);
    }
    
    @EventListener
    public void handleTestPurchase(TestPurchaseEvent event) {
        // Simulate callback
        GooglePlayCallbackRequest request = new GooglePlayCallbackRequest();
        request.setProductId(event.getProductId());
        request.setPurchaseToken(event.getPurchaseToken());
        request.setOrderId("test-" + System.currentTimeMillis());
        
        // Send callback to your endpoint
        simulateCallback(request);
    }
    
    private void simulateCallback(GooglePlayCallbackRequest request) {
        RestTemplate restTemplate = new RestTemplate();
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Signature", calculateTestSignature(request));
        
        HttpEntity<GooglePlayCallbackRequest> entity = new HttpEntity<>(request, headers);
        
        restTemplate.postForEntity(
            "http://localhost:8080/api/callbacks/googleplay/purchase",
            entity,
            CallbackResponse.class
        );
    }
}
```

### 2. Integration Test

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureTestDatabase
class GooglePlayCallbackIntegrationTest {
    
    @Autowired
    private TestRestTemplate restTemplate;
    
    @MockBean
    private GooglePlayBillingService billingService;
    
    @Test
    void testSuccessfulPurchaseCallback() {
        // Given
        GooglePlayCallbackRequest request = new GooglePlayCallbackRequest();
        request.setProductId("com.coflnet.skyblock.coflcoins.1800");
        request.setPurchaseToken("test-purchase-token");
        request.setOrderId("test-order-123");
        
        PaymentValidationResult validation = PaymentValidationResult.builder()
            .success(true)
            .orderId("test-order-123")
            .purchaseState(0)
            .acknowledgementState(0)
            .build();
        
        when(billingService.processCallbackPurchase(request))
            .thenReturn(PurchaseProcessingResult.success("test-order-123"));
        
        // When
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Signature", calculateSignature(request));
        
        HttpEntity<GooglePlayCallbackRequest> entity = new HttpEntity<>(request, headers);
        
        ResponseEntity<CallbackResponse> response = restTemplate.postForEntity(
            "/api/callbacks/googleplay/purchase",
            entity,
            CallbackResponse.class
        );
        
        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getStatus()).isEqualTo("success");
        assertThat(response.getBody().getOrderId()).isEqualTo("test-order-123");
    }
}
```

This callback implementation provides a robust, secure, and scalable way to handle Google Play payments with proper error handling, security measures, and monitoring capabilities.
