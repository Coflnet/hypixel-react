import GooglePlayProvider from "./GooglePlayProvider";
import StripePaymentProvider from "./StripePaymentProvider";

export default abstract class AbstractPaymentProvider {

    public abstract getProducts(): Promise<Product[]>;

    public abstract pay(): Promise<boolean>;

    public abstract checkIfPaymentIsPossible(): Promise<boolean>;
}