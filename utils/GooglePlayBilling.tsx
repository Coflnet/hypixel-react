/**
 * Google Play Billing Service for handling in-app purchases in PWA/TWA environment
 */

export interface GooglePlayProduct {
    productId: string
    title: string
    description: string
    price: string
    priceCurrencyCode: string
    priceAmountMicros: number
}

export interface GooglePlayPurchase {
    orderId: string
    packageName: string
    productId: string
    purchaseTime: number
    purchaseState: number
    purchaseToken: string
    quantity: number
    acknowledged: boolean
}

export interface GooglePlayBillingResult {
    responseCode: number
    debugMessage?: string
}

export interface GooglePlayPurchaseResult {
    billingResult: GooglePlayBillingResult
    purchases: GooglePlayPurchase[]
}

// Google Play Billing Response Codes
export enum GooglePlayBillingResponseCode {
    OK = 0,
    USER_CANCELED = 1,
    SERVICE_UNAVAILABLE = 2,
    BILLING_UNAVAILABLE = 3,
    ITEM_UNAVAILABLE = 4,
    DEVELOPER_ERROR = 5,
    ERROR = 6,
    ITEM_ALREADY_OWNED = 7,
    ITEM_NOT_OWNED = 8,
}

declare global {
    interface Window {
        googlePlayBilling?: {
            isReady(): Promise<boolean>
            queryProductDetails(productIds: string[]): Promise<GooglePlayProduct[]>
            launchBillingFlow(productId: string): Promise<GooglePlayPurchaseResult>
            acknowledgePurchase(purchaseToken: string): Promise<GooglePlayBillingResult>
            queryPurchases(): Promise<GooglePlayPurchase[]>
        }
        AndroidInterface?: {
            purchaseItem(productId: string): void
            acknowledgePurchase(purchaseToken: string): void
        }
    }
}

class GooglePlayBillingService {
    private isInitialized = false
    
    /**
     * Check if Google Play Billing is available
     */
    isAvailable(): boolean {
        return !!(window.googlePlayBilling || window.AndroidInterface)
    }

    /**
     * Initialize the billing service
     */
    async initialize(): Promise<boolean> {
        if (this.isInitialized) {
            return true
        }

        if (!this.isAvailable()) {
            console.warn('Google Play Billing is not available')
            return false
        }

        try {
            if (window.googlePlayBilling) {
                const isReady = await window.googlePlayBilling.isReady()
                this.isInitialized = isReady
                return isReady
            } else if (window.AndroidInterface) {
                // For legacy TWA implementations
                this.isInitialized = true
                return true
            }
        } catch (error) {
            console.error('Failed to initialize Google Play Billing:', error)
        }

        return false
    }

    /**
     * Get available products
     */
    async getProducts(productIds: string[]): Promise<GooglePlayProduct[]> {
        if (!this.isInitialized || !window.googlePlayBilling) {
            throw new Error('Google Play Billing is not initialized')
        }

        try {
            return await window.googlePlayBilling.queryProductDetails(productIds)
        } catch (error) {
            console.error('Failed to query product details:', error)
            throw error
        }
    }

    /**
     * Purchase a product
     */
    async purchaseProduct(productId: string): Promise<GooglePlayPurchase> {
        if (!this.isInitialized) {
            throw new Error('Google Play Billing is not initialized')
        }

        try {
            if (window.googlePlayBilling) {
                const result = await window.googlePlayBilling.launchBillingFlow(productId)
                
                if (result.billingResult.responseCode === GooglePlayBillingResponseCode.OK) {
                    if (result.purchases && result.purchases.length > 0) {
                        return result.purchases[0]
                    } else {
                        throw new Error('No purchase data received')
                    }
                } else {
                    throw new Error(`Purchase failed: ${result.billingResult.debugMessage || 'Unknown error'}`)
                }
            } else if (window.AndroidInterface) {
                // For legacy TWA - this would trigger a callback
                window.AndroidInterface.purchaseItem(productId)
                // In this case, the purchase result would come via a callback mechanism
                // For now, we'll throw an error indicating this needs to be handled differently
                throw new Error('Legacy purchase flow - handle via callback')
            }
        } catch (error) {
            console.error('Purchase failed:', error)
            throw error
        }

        throw new Error('No billing interface available')
    }

    /**
     * Acknowledge a purchase
     */
    async acknowledgePurchase(purchaseToken: string): Promise<void> {
        if (!this.isInitialized) {
            throw new Error('Google Play Billing is not initialized')
        }

        try {
            if (window.googlePlayBilling) {
                const result = await window.googlePlayBilling.acknowledgePurchase(purchaseToken)
                if (result.responseCode !== GooglePlayBillingResponseCode.OK) {
                    throw new Error(`Failed to acknowledge purchase: ${result.debugMessage || 'Unknown error'}`)
                }
            } else if (window.AndroidInterface) {
                window.AndroidInterface.acknowledgePurchase(purchaseToken)
            }
        } catch (error) {
            console.error('Failed to acknowledge purchase:', error)
            throw error
        }
    }

    /**
     * Get existing purchases
     */
    async getPurchases(): Promise<GooglePlayPurchase[]> {
        if (!this.isInitialized || !window.googlePlayBilling) {
            throw new Error('Google Play Billing is not initialized')
        }

        try {
            return await window.googlePlayBilling.queryPurchases()
        } catch (error) {
            console.error('Failed to query purchases:', error)
            throw error
        }
    }
}

// Export singleton instance
export const googlePlayBilling = new GooglePlayBillingService()

// CoflCoins product definitions for Google Play Store
export const GOOGLE_PLAY_PRODUCTS = {
    COFLCOINS_1800: 'com.coflnet.skyblock.coflcoins.1800',
    COFLCOINS_5400: 'com.coflnet.skyblock.coflcoins.5400'
}

export const GOOGLE_PLAY_PRODUCT_PRICES = {
    [GOOGLE_PLAY_PRODUCTS.COFLCOINS_1800]: 9.69,
    [GOOGLE_PLAY_PRODUCTS.COFLCOINS_5400]: 24.69
}

export const GOOGLE_PLAY_COFLCOIN_AMOUNTS = {
    [GOOGLE_PLAY_PRODUCTS.COFLCOINS_1800]: 1800,
    [GOOGLE_PLAY_PRODUCTS.COFLCOINS_5400]: 5400
}
