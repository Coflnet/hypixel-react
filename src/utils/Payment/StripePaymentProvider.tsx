import AbstractPaymentProvider from "./AbstractPaymentProvider";
import { loadStripe } from "@stripe/stripe-js";
import api from '../../api/ApiHelper';

export default class StripePaymentProvider extends AbstractPaymentProvider {

    private stripePromise;

    constructor() {
        super();
        this.stripePromise = loadStripe(
            "pk_test_51I6N5ZIIRKr1p7dQOGhRRigwIMqgZ3XnoBdbfezFNFgLiR9iaW2YzkRP9kAADCzxSOnqLeqKDVxglDh5uxvY28Dn00vAZR7wQ9"
        );
    }

    public async getProducts(log: Function): Promise<Product[]> {
        return await api.getStripeProducts();
    }

    public async pay(product: Product): Promise<Product> {
        api.pay(this.stripePromise, product);
        return product;
    }

    public async checkIfPaymentIsPossible(): Promise<boolean> {
        return true;
    }


    googleId = (): string | null => {
        //TODO move this function
        return localStorage.getItem('googleId');
    }
}