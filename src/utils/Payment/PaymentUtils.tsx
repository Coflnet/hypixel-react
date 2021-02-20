import GooglePlayProvider from "./GooglePlayProvider";
import StripePaymentProvider from "./StripePaymentProvider";

const paymentProviders = [
    GooglePlayProvider,
    StripePaymentProvider
]

const defaultPaymentProvider = StripePaymentProvider;

let currentProvider: AbstractPaymentProvider|null = null;

export default function availablePaymentProvider(): AbstractPaymentProvider {
    if (currentProvider) {
        return currentProvider;
    }
    for (const provider of paymentProviders) {
        let instance = provider();
        if (instance.checkIfPaymentIsPossible()) {
            currentProvider = instance;
            return instance;
        }
    }
    return defaultPaymentProvider();
}