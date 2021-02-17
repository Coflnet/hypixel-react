import { loadStripe } from "@stripe/stripe-js";
import api from '../../api/ApiHelper';

let stripePromise: any;

export default function StripePaymentProvider(): AbstractPaymentProvider {

    stripePromise = loadStripe(
        "pk_test_51I6N5ZIIRKr1p7dQOGhRRigwIMqgZ3XnoBdbfezFNFgLiR9iaW2YzkRP9kAADCzxSOnqLeqKDVxglDh5uxvY28Dn00vAZR7wQ9"
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