import AbstractPaymentProvider from "./AbstractPaymentProvider";
import GooglePlayProvider from "./GooglePlayProvider";
import StripePaymentProvider from "./StripePaymentProvider";

const paymentProviders = [
    GooglePlayProvider,
    StripePaymentProvider
]

const defaultPaymentProvider = StripePaymentProvider;

let currentProvider: AbstractPaymentProvider|null = null;

export default async function availablePaymentProvider(log: Function): Promise<AbstractPaymentProvider> {
    if (currentProvider) {
        return currentProvider
    } else {
        log('current provider is empty');
    }
    log(JSON.stringify(paymentProviders));
    for (const provider of paymentProviders) {
        log('checking provider..');
        log(JSON.stringify(provider));
        let instance = new provider();
        let paymentPossible = await instance.checkIfPaymentIsPossible(log);
        log('payment is ' + paymentPossible + ' possible')
        if (paymentPossible) {
            log('returning instance ' + provider.toString())
            currentProvider = instance;
            return instance;
        }
    }
    log('returning default provider');
    return new defaultPaymentProvider();
}