export default function PayPalProvider(): AbstractPaymentProvider {

	const name = 'paypal';

	function getProducts(): Promise<Product[]> {
		return new Promise((resolve, reject) => resolve([{
			itemId: 'premium_30',
			title: 'Premium (1 Month)',
			description: 'Premium (1 Month)',
			premiumDuration: 30,
			price: {
				productId: 'premium_30',
				currency: 'EUR',
				value: 3.19
			},
			introductoryPrice: {
				productId: 'premium_30',
				currency: 'EUR',
				value: 3.19
			},
			paymentProviderName: 'paypal'
		}, {
			itemId: 'premium_365',
			title: 'Premium (1 Year)',
			description: 'Premium (1 Year)',
			premiumDuration: 365,
			price: {
				productId: 'premium_365',
				currency: 'EUR',
				value: 16.19
			},
			introductoryPrice: {
				productId: 'premium_365',
				currency: 'EUR',
				value: 16.19
			},
			paymentProviderName: 'paypal'
		}]));
	}

	function pay(product: Product): Promise<Product> { 
		return new Promise((resolve, reject) => resolve(product))
	}

	function checkIfPaymentIsPossible(): boolean { 
		return true;
	}

	return {
		name,
		getProducts,
		pay,
		checkIfPaymentIsPossible
	};
}
