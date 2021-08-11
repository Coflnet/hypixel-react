import api from "../../api/ApiHelper";

const PAYMENT_METHOD = "https://play.google.com/billing";

const paymentDetails: PaymentDetails = {
    total: {
        label: `Total`,
        amount: { currency: `EUR`, value: `1` }
    }
}

let paymentMethods: PaymentMethod[] = [{
    supportedMethods: "https://play.google.com/billing",
    data: {
        sku: 'premium_1'
    }
}];

let digitalGoodsService: any;

export default function GooglePlayProvider(): AbstractPaymentProvider {

    const name = 'google_play';

    let getProducts = (): Promise<Product[]> => {
        console.log("get products");
        return new Promise((resolve, reject) => {
            if (!digitalGoodsService) {
                console.log("init digital goods service");
                setDigitalGoodsService().then(() => {
                    getProductsFromDigitalGoodsService().then(products => resolve(products));
                });
            } else {
                getProductsFromDigitalGoodsService().then(products => resolve(products));
            }
        })
    }

    let getProductsFromDigitalGoodsService = (): Promise<Product[]> =>
        digitalGoodsService.getDetails(['premium_30', 'premium_1', 'premium_3'])

    let pay = (product: Product): Promise<Product> => {
        console.log("paying product")
        console.log({product})
        return new Promise((resolve, reject) => {
            paymentMethods[0].data.sku = product.itemId;
            const request = new PaymentRequest(paymentMethods, paymentDetails);
            console.log({request})
            request.show().then(paymentResponse => {
                console.log({paymentResponse})
                const { token } = paymentResponse.details;
                product.description = token;
                validatePaymentToken(token, product).then(valid => {
                    if (valid) {
                        digitalGoodsService.acknowledge(token, 'onetime').then(() => {
                            paymentResponse.complete('success').then(() => {
                                resolve(product)
                            })
                        })
                    } else {
                        console.log("payment failed")
                        paymentResponse.complete('fail').then(() => {
                            reject(product)
                        });
                    }
                })
            });
        })
    }

    let checkIfPaymentIsPossible = (): boolean => {
        if (!window.PaymentRequest) {
        console.log("google play payment is not possible")
            return false;
        }
        if (!('getDigitalGoodsService' in window)) {
        console.log("google play payment is not possible")
            return false;
        }
        console.log("google play payment is possible")
        return true;
    }

    let validatePaymentToken = (token: string, product: Product): Promise<boolean> => {
        console.log("validate payment token");
        console.log({token});
        console.log({product});
        return api.validatePaymentToken(token, product.itemId);
    }

    let setDigitalGoodsService = (): Promise<void> => {
        console.log("set digital goods service");
        return new Promise((resolve, reject) => {
            if (!('getDigitalGoodsService' in window)) {
                throw new Error('getDigitalGoodsService not found');
            }
            console.log("digital goods service is available");
            (window as any).getDigitalGoodsService(PAYMENT_METHOD).then(service => {
                digitalGoodsService = service
                console.log({digitalGoodsService});
                resolve()
            });
        })
    }

    return {
        name,
        getProducts,
        pay,
        checkIfPaymentIsPossible
    }
}
