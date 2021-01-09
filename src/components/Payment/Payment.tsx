import React, { useState, useEffect } from "react";
import { GoogleLogin } from "react-google-login";
import { Button } from "react-bootstrap";
import { websocketHelper } from "../../api/WebsocketHelper";
import { RequestType } from "../../api/ApiTypes.d";
import { loadStripe } from "@stripe/stripe-js";
import api from "../../api/ApiHelper";

// After google sign in, ui does not refresh

function Payment() {
  let [premiumExpiration, setPremiumExpiration] = useState(new Date());

  let [googleId, setGoogleId] = useState(localStorage.getItem('googleId'));

  useEffect(() => {
    if (googleId) {
      api.hasPremium(googleId).then((expiration: Date) => {
        setPremiumExpiration(expiration);
      });
    }
  });


  const stripePromise = loadStripe(
    "pk_test_51I6N5ZIIRKr1p7dQOGhRRigwIMqgZ3XnoBdbfezFNFgLiR9iaW2YzkRP9kAADCzxSOnqLeqKDVxglDh5uxvY28Dn00vAZR7wQ9"
  );

  const onLoginSucces = (response: any) => {
    localStorage.setItem("googleId", response.googleId);
    setGoogleId(response.googleId);
  };

  const onPay = async () => {
    websocketHelper.sendRequest({
      type: RequestType.PAYMENT_SESSION,
      data: googleId,
      resolve: async (sessionId: any) => {
        const stripe = await stripePromise;
        if (stripe) {
          const result = await stripe.redirectToCheckout({
            sessionId: sessionId,
          });
          console.log({result});
        }
      },
      reject: (error: any) => {
        console.error(error);
      },
    });
  };

  return premiumExpiration > new Date() ? (
    <div>
      <h1>Premium until {premiumExpiration}</h1>
      <Button className="btn-success" onClick={() => onPay()}>
        extend
      </Button>
    </div>
  ) : googleId ? (
    <Button className="btn-success" onClick={() => onPay()}>
      Buy Premium
    </Button>
  ) : (
    <div>
      <GoogleLogin
        clientId="570302890760-nlkgd99b71q4d61am4lpqdhen1penddt.apps.googleusercontent.com"
        buttonText="Login"
        onSuccess={onLoginSucces}
        cookiePolicy={"single_host_origin"}
      />
    </div>
  );
}

export default Payment;
