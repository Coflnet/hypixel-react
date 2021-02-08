import React, { useEffect, useState } from "react";
import { Button } from 'react-bootstrap';
import AbstractPaymentProvider from "../../utils/Payment/AbstractPaymentProvider";
import availablePaymentProvider from "../../utils/Payment/PaymentUtils";

let paymentProvider: AbstractPaymentProvider;

function Payment() {

  let [message, _setMessage] = useState('');

  let [productListJsx, _setProductListJsx] = useState<JSX.Element>();


  const setMessage = (newMessage: string) => {
    if (message !== newMessage) {
      message = newMessage;
      _setMessage(message);
    }
  }

  const setProductsListJsx = (jsx: JSX.Element) => {
    if (productListJsx !== jsx) {
      productListJsx = jsx;
      _setProductListJsx(productListJsx);
    }
  }

  const log = (msg: string) => {
    let newString = message + '\n' + msg;
    setMessage(newString);
  }


  const getProducts = async () => {
    if (!paymentProvider) {
      paymentProvider = await availablePaymentProvider();
    }
    return await paymentProvider.getProducts();
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
            {product.price.value}
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


  const onPay = async (product: Product) => {
    paymentProvider.pay(product);
  }

  const clearMessages = () => {
    setMessage('');
  }

  const setProductsJsx = async () => setProductsListJsx(await getProductsJsx())

  useEffect(() => { setProductsJsx() }, []);

  return (
    <div>
      <Button className="btn-success" onClick={clearMessages}>
        Clear Messages
    </Button>
      {productListJsx}
      <pre>
        {message}
      </pre>
    </div>
  )
}

export default Payment;