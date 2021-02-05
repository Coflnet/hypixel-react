import React, { useEffect, useState } from "react";
import { Button } from 'react-bootstrap';
import AbstractPaymentProvider from "../../utils/Payment/AbstractPaymentProvider";
import availablePaymentProvider from "../../utils/Payment/PaymentUtils";

let paymentProvider: AbstractPaymentProvider;

function Payment() {

  let [message, _setMessage] = useState('');

  let [productListJsx, _setProductListJsx] = useState<JSX.Element[]>();


  const setMessage = (newMessage: string) => {
    if (message !== newMessage) {
      message = newMessage;
      _setMessage(message);
    }
  }

  const setProductsListJsx = (jsx: JSX.Element[]) => {
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

  const getProductsJsx = async () => {
    const products = await getProducts();
    const jsx = products.map(product => {
      return <li key={product.itemId}>{product.title}</li>;
    });
    setProductsListJsx(jsx);
  }

  const onPay = async () => {
    let product = (await getProducts())[0]
    paymentProvider.pay(product);
  }

  const clearMessages = () => {
    setMessage('');
  }

  useEffect(() => { getProductsJsx() }, []);

  return (
    <div>
      <Button className="btn-success" onClick={onPay}>
        Buy Premium
    </Button>
      <Button className="btn-success" onClick={clearMessages}>
        Clear Messages
    </Button>
      <div className="container">
        {productListJsx}
      </div>
      <pre>
        {message}
      </pre>
    </div>
  )
}

export default Payment;