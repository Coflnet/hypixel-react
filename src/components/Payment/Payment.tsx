import React, { useEffect, useState } from "react";
import { Button } from 'react-bootstrap';
import availablePaymentProvider from "../../utils/Payment/PaymentUtils";

let paymentProvider: AbstractPaymentProvider;

function Payment() {

  let [productListJsx, _setProductListJsx] = useState<JSX.Element>();

  let [message, _setMessage] = useState('');

  useEffect(() => { setProductsJsx() }, []);

  const setMessage = (msg: string) => {
    if (message !== msg) {
      message = msg;
      _setMessage(message);
    }
  }

  const log = (msg: string) => setMessage(message + '\n' + msg);

  const setProductsListJsx = (jsx: JSX.Element) => {
    if (productListJsx !== jsx) {
      productListJsx = jsx;
      _setProductListJsx(productListJsx);
    }
  }

  const getProducts = async () => {
    log('getting products..');
    if (!paymentProvider) {
      log('getting payment provider..');
      paymentProvider = availablePaymentProvider(log);
      log('got payment provider');
      log(JSON.stringify(paymentProvider));
    }
    log('reallly getting products..');
    return await paymentProvider.getProducts(log);
  }

  const getProductsJsx = async (): Promise<JSX.Element> => {
    const products = await getProducts();
    return (
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
  }

  const roundToTwo = (param: number): number => Math.round(param * 10 ** 2) / 10 ** 2;

  const onPay = async (product: Product) => {
    paymentProvider.pay(product);
  }

  const setProductsJsx = async () => setProductsListJsx(await getProductsJsx())

  return (
    <div>
      {productListJsx}
      <pre>
        {message}
      </pre>
    </div>
  )
}

export default Payment;