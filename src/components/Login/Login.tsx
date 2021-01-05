import React, { useState } from "react";
import { GoogleLogin } from "react-google-login";
import { Button } from "react-bootstrap";
import { loadStripe } from "@stripe/stripe-js";
import { websocketHelper } from "../../api/WebsocketHelper";
import { RequestType } from "../../api/ApiTypes.d";

function Login() {
  let [hasPremium, setHasPremium] = useState(
    localStorage.getItem("hasPremium")
  );

  let [googleId, setGoogleId] = useState(localStorage.getItem("googleId"));

  const stripePromise = loadStripe(
    "pk_test_51I6N5ZIIRKr1p7dQOGhRRigwIMqgZ3XnoBdbfezFNFgLiR9iaW2YzkRP9kAADCzxSOnqLeqKDVxglDh5uxvY28Dn00vAZR7wQ9"
  );

  const onLoginSucces = (response: any) => {
    localStorage.setItem("googleId", response.googleId);
  };

  const onPay = async () => {
    console.log("paying..");

    const supportedPaymentMethods = [
      {
        supportedMethods: "basic-card",
      },
    ];
    const paymentDetails = {
      total: {
        label: "Total",
        amount: {
          currency: "EUR",
          value: 1.99,
        },
      },
    };
    // Options isn't required.
    const options = {};

    try {
      const request = new PaymentRequest(
        supportedPaymentMethods,
        paymentDetails as any,
        options
      );
      await request.show().then(async (e) => {
        websocketHelper.sendRequest({
          type: RequestType.PAYMENT_SESSION,
          data: googleId,
          resolve: async (item: any) => {
            console.log(item);
            const result = await stripe.redirectToCheckout({
              sessionId: session.id,
            });
            if (result.error) {
              console.log(result.error);
            }
            e.complete("success");
          },
          reject: (error: any) => {
            console.log(error);
          },
        });
      });
    } catch (e) {
      if (e instanceof ReferenceError) {
        // when paying in safari or other incompetent browser
        alert("payment did not work. Pls try chrome or chromium based browser");
      } else {
        alert("payment did not work");
        console.log(e);
      }
    }
  };

  return hasPremium ? (
    <h1>Player has premium</h1> 
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

export default Login;
