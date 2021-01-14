import React from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from 'react-bootstrap';
import api from "../../api/ApiHelper";

const stripePromise = loadStripe(
  "pk_test_51I6N5ZIIRKr1p7dQOGhRRigwIMqgZ3XnoBdbfezFNFgLiR9iaW2YzkRP9kAADCzxSOnqLeqKDVxglDh5uxvY28Dn00vAZR7wQ9"
);

function Payment() {

  const onPay = () => {
    const googleId = localStorage.getItem('googleId');
    if (googleId) {
      api.pay(stripePromise, googleId)
    } else {
      console.warn('not logged in in google yet')
    }
  };

  return (
    <Button className="btn-success" onClick={onPay}>
      Buy Premium
    </Button>
  )
}

export default Payment;