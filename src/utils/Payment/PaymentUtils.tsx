import AbstractPaymentProvider from "./AbstractPaymentProvider";
import GooglePlayProvider from "./GooglePlayProvider";
import StripePaymentProvider from "./StripePaymentProvider";

const paymentProviders = [
    GooglePlayProvider,
    StripePaymentProvider
]

const defaultPaymentProvider = StripePaymentProvider;

export default async function availablePaymentProvider(log: Function): Promise<AbstractPaymentProvider> {
    log(JSON.stringify(paymentProviders));
    await paymentProviders.forEach(async (provider) => {
        log('checking provider..');
        log(JSON.stringify(provider.toString()));
        let instance = new provider();
        let paymentPossible = await instance.checkIfPaymentIsPossible();
        log('payment is ' + paymentPossible + ' possible')
        if (paymentPossible) {
            log('returning instance ' + provider.toString())
            return instance;
        }
    })
    log('returning default provider');
    return new defaultPaymentProvider();
}