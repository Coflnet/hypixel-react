import GooglePlayProvider from "./GooglePlayProvider";
import StripePaymentProvider from "./StripePaymentProvider";

const paymentProviders = [
    GooglePlayProvider,
    StripePaymentProvider
]

const defaultPaymentProvider = StripePaymentProvider;

let currentProvider: AbstractPaymentProvider|null = null;

export default async function availablePaymentProvider(): Promise<AbstractPaymentProvider> {
    if (currentProvider) {
        return currentProvider;
    }
    for (const provider of paymentProviders) {
        let instance = provider();
        let paymentPossible = await instance.checkIfPaymentIsPossible();
        if (paymentPossible) {
            currentProvider = instance;
            return instance;
        }
    }
    return defaultPaymentProvider();
}