import api from "../../api/ApiHelper";

export default function PayPalProvider(): AbstractPaymentProvider {

	const name = 'paypal';

	function getProducts(): Promise<Product[]> {
		return api.getProducts(name);
	}

	/**
	 * Does nothings, as the paypal purchase is handled by the paypal button
	 * @param product The product that is going to be bought
	 * @returns The same product
	 */
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
