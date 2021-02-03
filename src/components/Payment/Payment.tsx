import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from 'react-bootstrap';
import api from "../../api/ApiHelper";

const stripePromise = loadStripe(
  "pk_test_51I6N5ZIIRKr1p7dQOGhRRigwIMqgZ3XnoBdbfezFNFgLiR9iaW2YzkRP9kAADCzxSOnqLeqKDVxglDh5uxvY28Dn00vAZR7wQ9"
);

function Payment() {

    let [message, setMessage] = useState("");

  const onPay = async () => {
    message = '';
    const googleId = localStorage.getItem('googleId');
    if ('getDigitalGoodsService' in window) {
      message += 'digital good service is supported\n'; 
      const service = await (window as any).getDigitalGoodsService('https://play.google.com/billing');
      message += JSON.stringify(service) + '\n';
    } else {
      message = 'digital good service is not supported\n'; 
    }
    setMessage(message);
  };

  return (
    <div>
    <Button className="btn-success" onClick={onPay}>
      Buy Premium
    </Button>
    <pre>
      {message}
    </pre>
    </div>
  )
}

export default Payment;