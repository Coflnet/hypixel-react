import AbstractPaymentProvider from "./AbstractPaymentProvider";
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
        let instance = new provider();
        let paymentPossible = await instance.checkIfPaymentIsPossible();
        if (paymentPossible) {
            log('returning instance ' + provider.toString())
            currentProvider = instance;
            return instance;
        }
    }
    return new defaultPaymentProvider();
}