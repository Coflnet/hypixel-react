import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from 'react-bootstrap';
import api from "../../api/ApiHelper";

const stripePromise = loadStripe(
  "pk_test_51I6N5ZIIRKr1p7dQOGhRRigwIMqgZ3XnoBdbfezFNFgLiR9iaW2YzkRP9kAADCzxSOnqLeqKDVxglDh5uxvY28Dn00vAZR7wQ9"
);

const PAYMENT_METHOD = "https://play.google.com/billing";

function Payment() {

  let [message, setMessage] = useState("");

  const log = (msg: string) => {
    setMessage(message + msg + '\n');
  }

  const googleId = () => {
    return localStorage.getItem('googleId');
  }

  const checkPaymentPossible = (): boolean => {
    if (!window.PaymentRequest) {
      log("No PaymentRequest object.");
      return false;
    }
    return true;
  }

  const pay = () => {
    log('Going to pay');
    log('dont know how to pay..')
  }

  const onPay = async () => {

    let paymentPossible = checkPaymentPossible()

    if (paymentPossible) {
      log('payment is possible')
      pay()
    }

  }

  const clearMessages = () => {
    setMessage('');
  }


  return (
    <div>
      <Button className="btn-success" onClick={onPay}>
        Buy Premium
    </Button>
      <Button className="btn-success" onClick={clearMessages}>
        Clear Messages
    </Button>
      <pre>
        {message}
      </pre>
    </div>
  )
}

export default Payment;