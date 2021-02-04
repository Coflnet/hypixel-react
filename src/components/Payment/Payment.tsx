import React, { useEffect, useState } from "react";
// import { loadStripe } from "@stripe/stripe-js";
import { Button } from 'react-bootstrap';

//TODO remove
/*
import too
const stripePromise = loadStripe(
  "pk_test_51I6N5ZIIRKr1p7dQOGhRRigwIMqgZ3XnoBdbfezFNFgLiR9iaW2YzkRP9kAADCzxSOnqLeqKDVxglDh5uxvY28Dn00vAZR7wQ9"
);
*/

const PAYMENT_METHOD = "https://play.google.com/billing";

const logPromise: Promise<void> | null = null;

function Payment() {

  let [message, _setMessage] = useState('');

  let [productListJsx, setProductListJsx] = useState([]);

  const setMessage = (newMessage: string) => {
    if (message !== newMessage) {
      message = newMessage;
      _setMessage(message);
    }
  }

  const log = (msg: string) => {
    let newString = message + '\n' + msg;
    setMessage(newString);
  }

  const googleId = () => {
    return localStorage.getItem('googleId');
  }

  const getDigitalGoodsService = async () => {
    if (!('getDigitalGoodsService' in window)) {
      throw 'getDigitalGoodsService not found';
    }
    return (window as any).getDigitalGoodsService(PAYMENT_METHOD);
  }

  const getProducts = async () => {
    try {
      const service = await getDigitalGoodsService();
      if (service) {
        return await service.getDetails(['premium_30']);
      }
    } catch(e) {
      log(e);
      return [];
    }
  }

  const getProductsJsx = async () => {
    const products = await getProducts();
    log('rendering list');
    log(`got a list with ${products.length} items`)
    setProductListJsx(products.map(product => {
      log(JSON.stringify(product));
      return <li>{product.title}</li>;
    }))
  }

  const checkPaymentPossible = (): boolean => {
    if (!window.PaymentRequest) {
      log("No PaymentRequest object.");
      return false;
    }
    if (!('getDigitalGoodsService' in window)) {
      log('DigitalGoodsService not found');
      return false;
    }
    return true;
  }

  const pay = async () => {
    log('payment not implemented yet');
  }

  const onPay = () => {

    let paymentPossible = checkPaymentPossible()

    if (paymentPossible) {
      log('payment is possible')
      pay()
    } else {
      log('dont know how to pay..')
    }

  }

  const clearMessages = () => {
    setMessage('');
  }

  useEffect(() => { getProductsJsx() });

  return (
    <div>
      <Button className="btn-success" onClick={onPay}>
        Buy Premium
    </Button>
      <Button className="btn-success" onClick={clearMessages}>
        Clear Messages
    </Button>
      <li>
        {productListJsx}
      </li>
      <pre>
        {message}
      </pre>
    </div>
  )
}

export default Payment;