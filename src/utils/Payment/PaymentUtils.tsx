import GooglePlayProvider from "./GooglePlayProvider";
import StripePaymentProvider from "./StripePaymentProvider";

const paymentProviders = [
    GooglePlayProvider,
    StripePaymentProvider
]

const defaultPaymentProvider = StripePaymentProvider;

let currentProvider: AbstractPaymentProvider|null = null;

export default function availablePaymentProvider(log: Function): AbstractPaymentProvider {
    log('searching available provider');
    if (currentProvider) {
        log('returning current provider');
        log(JSON.stringify(currentProvider));
        return currentProvider;
    }
    for (const provider of paymentProviders) {
        let instance = provider();
        log('checking provider');
        log(provider.toString());
        log(JSON.stringify(instance));
        if (instance.checkIfPaymentIsPossible()) {
            log('returning instace');
            log(JSON.stringify(instance));
            log(provider.toString());
            currentProvider = instance;
            return instance;
        }
    }
    log('returning default provider');
    return defaultPaymentProvider();
}