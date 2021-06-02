import { loadStripe } from "@stripe/stripe-js";
import api from '../../api/ApiHelper';

let stripePromise: any;

export default function StripePaymentProvider(): AbstractPaymentProvider {

    stripePromise = loadStripe(
        "pk_live_51I6N5ZIIRKr1p7dQn1VonQvGlnw4OtOCgO8ppw794BZme57v2tgTYdRd3bmEEmNq3KiCm90aGugMf004EwuphvJ800R2J4yJ6v"
    );

    let getProducts = (): Promise<Product[]> => {
        return new Promise((resolve, reject) => {
            resolve(api.getStripeProducts());
        })
    }

    let pay = (product: Product): Promise<Product> => {
        return new Promise((resolve, reject) => {
            api.pay(stripePromise, product);
            resolve(product);
        })
    }

    let checkIfPaymentIsPossible = (): boolean => true

    return {
        getProducts,
        pay,
        checkIfPaymentIsPossible
    }
}
