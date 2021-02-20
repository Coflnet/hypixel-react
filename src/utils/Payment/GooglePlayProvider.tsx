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

    let getProducts = (log: Function): Promise<Product[]> => {
        log('getting products from google');
        return new Promise((resolve, reject) => {
            if (!digitalGoodsService) {
                log('getting digital goods service');
                setDigitalGoodsService(log).then(() => {
                    if (digitalGoodsService) {
                        log('got digital goods service');
                        log(JSON.stringify(digitalGoodsService));
                        digitalGoodsService.getDetails(['premium_30', 'premium_1', 'premium_3']).then(result => {
                            log('results: ');
                            log(JSON.stringify(result));
                            resolve(result)
                        }).catch(err => {
                            log('got an error');
                            log(JSON.stringify(err));
                            reject(err);
                        });
                    }
                });
            }
        })
    }
    
    let pay = (product: Product): Promise<Product> => {
        return new Promise((resolve, reject) => {
            paymentMethods[0].data.sku = product.itemId;
            const request = new PaymentRequest(paymentMethods, paymentDetails);
            request.show().then(paymentResponse => {
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
            return false;
        }
        if (!('getDigitalGoodsService' in window)) {
            return false;
        }
        return true;
    }

    let validatePaymentToken = (token: string, product: Product): Promise<boolean> => {
        return api.validatePaymentToken(token, product.itemId);
    }

    let setDigitalGoodsService = (log: Function): Promise<void> => {
        return new Promise((resolve, reject) => {
            log('getting digital goods service 2');
            if (!('getDigitalGoodsService' in window)) {
                log('not found');
                throw 'getDigitalGoodsService not found';
            }
            log('digital goods service is in window');
            (window as any).getDigitalGoodsService(PAYMENT_METHOD).then(service => {
                digitalGoodsService = service
                resolve()
            });
        })
    }

    return {
        getProducts,
        pay,
        checkIfPaymentIsPossible
    }
}
