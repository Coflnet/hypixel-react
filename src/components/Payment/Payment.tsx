import React, { useEffect, useState } from "react";
import { Button } from 'react-bootstrap';
import availablePaymentProvider from "../../utils/Payment/PaymentUtils";

let paymentProvider: AbstractPaymentProvider;

function Payment() {

  let [productListJsx, _setProductListJsx] = useState<JSX.Element>();

  useEffect(() => { setProductsJsx() }, []);

  const setProductsListJsx = (jsx: JSX.Element) => {
    if (productListJsx !== jsx) {
      productListJsx = jsx;
      _setProductListJsx(productListJsx);
    }
  }

  const getProducts = (): Promise<Product[]> => {
    if (!paymentProvider) {
      paymentProvider = availablePaymentProvider();
    }
    return paymentProvider.getProducts();
  }

  const getProductsJsx = (): Promise<JSX.Element> => {
    return new Promise((resolve, reject) => {
      getProducts().then(products => {
        resolve(
          <div className="container px-1 py-1">
            <div className="row justify-content-center">
              <div className="col-7">
                <b>Title</b>
              </div>
              <div className="col-2">
                <b>Price</b>
              </div>
              <div className="col-3">
              </div>
            </div>
            {products.map(product => <div className="row justify-content-center" key={product.itemId}>
              <div className="col-7">
                {product.title}
              </div>
              <div className="col-2">
                {roundToTwo(product.price.value)}
              </div>
              <div className="col-3">
                <Button onClick={() => {onPay(product)}}>
                  Buy
                </Button>
              </div>
            </div>)
            }
          </div>
        )
      });
    });
  }

  const roundToTwo = (param: number): number => Math.round(param * 10 ** 2) / 10 ** 2;

  const onPay = (product: Product) => {
    paymentProvider.pay(product);
  }

  const setProductsJsx = () => getProductsJsx().then(jsx => setProductsListJsx(jsx))

  return (
    <div>
      {productListJsx}
    </div>
  )
}

export default Payment;