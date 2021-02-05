import React, { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from 'react-bootstrap';
import api from '../../api/ApiHelper';

const stripePromise = loadStripe(
  "pk_test_51I6N5ZIIRKr1p7dQOGhRRigwIMqgZ3XnoBdbfezFNFgLiR9iaW2YzkRP9kAADCzxSOnqLeqKDVxglDh5uxvY28Dn00vAZR7wQ9"
);

const PAYMENT_METHOD = "https://play.google.com/billing";

interface Product {
  title: string,
  price: number
}

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

  const googleId = (): string | null => {
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
      return await getProductsFromPlayStore(service);
    } catch (e) {
      return await getProductsFromStripe();
    }
  }

  const getProductsFromPlayStore = async (service) => {
    if (service) {
      let result = await service.getDetails(['premium_30', 'premium_1']);
      log(JSON.stringify(result));
      return result;
    }
  }

  const getProductsFromStripe = async (): Promise<Array<Product>> => {
    log('fetchiing products from stripe is not implemented yet..');
    return [];
  }

  const getProductsJsx = async () => {
    const products = await getProducts();
    setProductListJsx(products.map(product => {
      return <li>{product.title}</li>;
    }))
  }

  const checkPaymentPlayStoreIsPossible = (): boolean => {
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

  const paymentMethod = () => {
    return [{
      supportedMethods: "https://play.google.com/billing",
      data: {
        sku: 'premium_1',
      }
    }];
  }

  const paymentDetails = () => {
    return {
      total: {
        label: `Total`,
        amount: { currency: `USD`, value: `3` }
      }
    }
  }

  const payWithPlayStore = async () => {
    const request = new PaymentRequest(paymentMethod(), paymentDetails());
    try {
      const paymentResponse = await request.show();
      const { token } = paymentResponse.details;
      const service = await getDigitalGoodsService();
      if (validatePaymentToken(token)) {
        await service.acknowledge(token, 'onetime');
        const paymentComplete = await paymentResponse.complete('success');
      } else {
        const paymentComplete = await paymentResponse.complete('fail');
      }
    } catch (e) {
      log(JSON.stringify(e));
    }
  }

  const validatePaymentToken = (token) => {
    // TODO implement
    return true;
  }

  const payWithStripe = async () => {
    let id = googleId();
    if (id) {
      api.pay(stripePromise, id);
    }
  }

  const onPay = () => {
    let paymentPossible = checkPaymentPlayStoreIsPossible()
    if (paymentPossible) {
      payWithPlayStore()
    } else {
      payWithStripe()
    }

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