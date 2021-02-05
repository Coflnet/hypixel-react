import AbstractPaymentProvider from "./AbstractPaymentProvider";
import GooglePlayProvider from "./GooglePlayProvider";
import StripePaymentProvider from "./StripePaymentProvider";

const paymentProviders = [
    GooglePlayProvider,
    StripePaymentProvider
]

const defaultPaymentProvider = StripePaymentProvider;

export default async function availablePaymentProvider(): Promise<AbstractPaymentProvider> {
    await paymentProviders.forEach(async (provider) => {
        let instance = new provider();
        let paymentPossible = await instance.checkIfPaymentIsPossible();
        if (paymentPossible) {
            return instance;
        }
    })
    return new defaultPaymentProvider();
}