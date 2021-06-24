import GooglePlayProvider from "./GooglePlayProvider";
import StripePaymentProvider from "./StripePaymentProvider";
import PayPalProvider from './PayPalProvider';

const paymentProviders = [
    GooglePlayProvider,
    StripePaymentProvider,
    PayPalProvider
]


let currentProviders: AbstractPaymentProvider[] = [];

export default function availablePaymentProvider(): AbstractPaymentProvider[] {
    if (currentProviders.length >= 1) {
        return currentProviders;
    }
    for (const provider of paymentProviders) {
        let instance = provider();
        if (instance.checkIfPaymentIsPossible()) {
            currentProviders.push(instance);
        }
    }
    if (currentProviders.length >= 1) {
        return currentProviders;
    }
    const defaultPaymentProvider = [StripePaymentProvider()];
    return defaultPaymentProvider;
}

export function groupProductsByDuration(products: Product[]): Product[][] {
    products = products.sort((a: Product, b: Product) => {
        if (!a.premiumDuration || !b.premiumDuration) {
            return 0;
        }
        if (a.premiumDuration < b.premiumDuration) {
            return -1;
        }
        if (a.premiumDuration > b.premiumDuration) {
            return 1;
        }
        return 0;
    });

    let res: Product[][] = [];
    let index = 0;

    products.forEach((product, i) => {
        if (i === 0) {
            res.push([product]);
        } else {
            if (res[index][0].premiumDuration === product.premiumDuration) {
                res[index].push(product)
            } else {
                index++;
                res[index] = [];
                res[index].push(product);
            }
        }
    });

    return res;
}