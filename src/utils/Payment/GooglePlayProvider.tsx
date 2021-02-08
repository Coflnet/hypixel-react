import AbstractPaymentProvider from "./AbstractPaymentProvider";

const PAYMENT_METHOD = "https://play.google.com/billing";

const paymentDetails: PaymentDetails = {
    total: {
        label: `Total`,
        amount: { currency: `USD`, value: `1` }
    }
}

const paymentMethods: PaymentMethod[] = [{
    supportedMethods: "https://play.google.com/billing",
    data: {
        sku: 'premium_1'
    }
}];


export default class GooglePlayProvider extends AbstractPaymentProvider {

    private digitalGoodsService: any;

    constructor() {
        super();
        this.checkIfPaymentIsPossible(() => {}).then(possible => possible ?? this.setDigitalGoodsService())
    }

    public async getProducts(): Promise<Product[]> {
        if (this.digitalGoodsService) {
            let result = await this.digitalGoodsService.getDetails(['premium_30', 'premium_1']);
            return result;
        }
        return [];
    }

    public async pay(product: Product): Promise<Product> {
        const request = new PaymentRequest(paymentMethods, paymentDetails);
        const paymentResponse = await request.show();
        const { token } = paymentResponse.details;
        product.description = token;
        if (this.validatePaymentToken(token)) {
            await this.digitalGoodsService.acknowledge(token, 'onetime');
            await paymentResponse.complete('success');
            return product;
        } else {
            await paymentResponse.complete('fail');
            return product;
        }
    }

    public async checkIfPaymentIsPossible(log: Function): Promise<boolean> {
        log('google play check is executed now');
        if (!window.PaymentRequest) {
            log('payment request is not in scope');
            return false;
        }
        if (!('getDigitalGoodsService' in window)) {
            log('digital googds service is not in scope');
            return false;
        }
        log('returning true');
        return true;
    }

    private async validatePaymentToken(token: string): Promise<boolean> {
        //TODO implement
        return true;
    }

    private setDigitalGoodsService() {
        if (!('getDigitalGoodsService' in window)) {
            throw 'getDigitalGoodsService not found';
        }
        this.digitalGoodsService = (window as any).getDigitalGoodsService(PAYMENT_METHOD);
    }
}