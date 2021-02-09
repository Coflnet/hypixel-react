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

    public async getProducts(log: Function): Promise<Product[]> {
        if (!this.digitalGoodsService) {
            log('setting digital goods service');
            await this.setDigitalGoodsService();
        }
        log('loading products...');
        if (this.digitalGoodsService) {
            log(JSON.stringify(this.digitalGoodsService));
            let result = await this.digitalGoodsService.getDetails(['premium_30', 'premium_1']);
            log('result from getProducts');
            log(JSON.stringify(result));
            return result;
        }
        log('returning empty array');
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

    public async checkIfPaymentIsPossible(): Promise<boolean> {
        if (!window.PaymentRequest) {
            return false;
        }
        if (!('getDigitalGoodsService' in window)) {
            return false;
        }
        return true;
    }

    private async validatePaymentToken(token: string): Promise<boolean> {
        //TODO implement
        return true;
    }

    private async setDigitalGoodsService() {
        if (!('getDigitalGoodsService' in window)) {
            throw 'getDigitalGoodsService not found';
        }
        this.digitalGoodsService = await (window as any).getDigitalGoodsService(PAYMENT_METHOD);
    }
}