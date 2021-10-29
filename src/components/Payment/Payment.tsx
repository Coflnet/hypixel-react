import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom"
import { Button, Card } from 'react-bootstrap';
import { getLoadingElement } from "../../utils/LoadingUtils";
import availablePaymentProvider, { groupProductsByDuration } from "../../utils/Payment/PaymentUtils";
import './Payment.css';
import api from "../../api/ApiHelper";
import { toast } from "react-toastify";
import { useHistory } from "react-router-dom";
import Tooltip from "../Tooltip/Tooltip";
import { Help as HelpIcon } from '@material-ui/icons';

declare var paypal: any;
let PayPalButton;

interface Props {
  hasPremium: boolean
}

function Payment(props: Props) {

  let [products, setProducts] = useState<Product[][]>([]);
  let [isLoading, setIsLoading] = useState(true);
  let history = useHistory();

  useEffect(() => {
    loadProducts();
    insertPaypalSDK();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function insertPaypalSDK() {
    let id = "paypal-skd-script";
    if (!document.getElementById(id)) {
      let script = document.createElement("script")
      script.type = "text/javascript";
      script.id = id;
      script.async = true;
      script.src = "https://www.paypal.com/sdk/js?client-id=Aak_J-tnckfr6kBQPj0GrMoOpbcG6HTrzx5svF8gGcH5AH2XwbwIVIdK8In05-38TPHofJZE2u4dRWSj&locale=en_US&disable-funding=credit,card,giropay,sofort&currency=EUR";
      document.getElementsByTagName("head")[0].appendChild(script);
    }
  }

  function loadProducts(): Promise<void> {

    let products2: Product[] = [];
    let promises: Promise<void>[] = [];

    try {
      for (let provider of availablePaymentProvider()) {
        let promise = provider.getProducts().then(loadedProducts => {
          products2.push(...loadedProducts);
        });
        promises.push(promise);
      }
      return Promise.all(promises).then(() => {
        onAfterLoadProducts(products2);
      });
    } catch(e) {
        return new Promise((resolve, _) => {
            onAfterLoadProducts([]);
            resolve();
        })
    }
  }

  function onAfterLoadProducts(products) {
    if (!(window as any).paypal) {
      setTimeout(() => {
        onAfterLoadProducts(products);
      }, 100);
      return;
    }

    PayPalButton = paypal.Buttons.driver("react", { React, ReactDOM });

    let newProducts = groupProductsByDuration(products);
    products = newProducts;
    setProducts(products);
    setIsLoading(false);
  }

  const createOrder = (product, actions) => {
    return actions.order.create({
      purchase_units: [{
        amount: {
          value: product.price.value
        }
      }]
    });
  };

  const onApprove = (product, actions) => {
    return actions.order.capture().then(function (details) {

      if (product.premiumDuration) {
        api.paypalPurchase(details.id, product.premiumDuration).then(response =>
          history.push({
            pathname: "/success"
          })
        ).catch(error => {
          let message = error && error.Message ? error.Message : "An Error occoured while trying to pay with paypal"
          toast.error(message);
        })
      } else {
        history.push({
          pathname: "/cancel"
        });
      }
    });
  };

  const roundToTwo = (param: number): number => Math.round(param * 10 ** 2) / 10 ** 2;


  const onPay = (product: Product) => {
    let provider = availablePaymentProvider().find(provider => provider?.name === product.paymentProviderName);
    if (!provider) {
      provider = availablePaymentProvider()[0];
    }
    provider?.pay(product);
  }

    let planList = products.length == 0 ?
      <p>
        you can not buy premium in the android app.
        please check the discord server for more information
      </p> :
      products.map((productGroup, i) => {
      return (
        <Card key={'product-group-' + i} className="premium-plan-card">
          <Card.Header>
            <h4>{productGroup[0].title}</h4>
          </Card.Header>
          <Card.Body>
          {
            productGroup.map((product, i) => {
              return (
                <div key={product.itemId}>
                  <p className="premium-price">Price: {roundToTwo(product.price.value)}
                    {product?.paymentProviderName === 'paypal' ? <Tooltip content={<span style={{ marginLeft: "5px" }}><HelpIcon /></span>} type="hover" tooltipContent={<p>Higher price than with credit card due to higher fees</p>} /> : ""}
                  </p>
                  {
                    product?.paymentProviderName === 'paypal' ?
                      <div style={{ position: "relative", zIndex: 0 }}>
                        <PayPalButton
                          createOrder={(data, actions) => createOrder(product, actions)}
                          onApprove={(data, actions) => onApprove(product, actions)}

                        />
                      </div> :
                      product?.paymentProviderName === 'stripe' ?
                        <Button variant="success" onClick={() => { onPay(product) }}>
                          Buy with credit card
                        </Button> :
                        <Button variant="success" onClick={() => { onPay(product) }}>
                          Buy with Google Pay
                        </Button>
                  }
                  {
                    i < productGroup.length - 1 ? <hr /> : ""
                  }
                </div>
              )
            })
            }
          </Card.Body>
        </Card>)
      })


  return (
    <div>
      {
        isLoading ?
          getLoadingElement() :
          (
            <div className="premium-plans">
              <h2>Premium-Plans</h2>
              {planList}
            </div>
          )
      }
    </div >
  )
}

export default Payment;
