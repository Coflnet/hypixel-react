export default function PayPalProvider(): AbstractPaymentProvider {

	function getProducts(): Promise<Product[]> {
		return new Promise((resolve, reject) => resolve([]))
	}

	function pay(product: Product): Promise<Product> { 
		return new Promise((resolve, reject) => resolve(product))
	}

	function checkIfPaymentIsPossible(): boolean { 
		return true;
	}

	function generateButton(product: Product): any {
	}

	return {
		getProducts,
		pay,
		checkIfPaymentIsPossible,
		generateButton
	};
}
