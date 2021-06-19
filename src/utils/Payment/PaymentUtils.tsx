import GooglePlayProvider from "./GooglePlayProvider";
import StripePaymentProvider from "./StripePaymentProvider";
import PayPalProvider from './PayPalProvider';

const paymentProviders = [
    GooglePlayProvider,
    StripePaymentProvider,
    PayPalProvider
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