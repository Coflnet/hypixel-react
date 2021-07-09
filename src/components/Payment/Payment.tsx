import React, { useEffect, useState } from "react";
import { Button, Card } from 'react-bootstrap';
import { getLoadingElement } from "../../utils/LoadingUtils";
import availablePaymentProvider, { groupProductsByDuration } from "../../utils/Payment/PaymentUtils";
import './Payment.css';
import { v4 as generateUUID } from 'uuid';
import api from "../../api/ApiHelper";
import { toast } from "react-toastify";
import { useHistory } from "react-router-dom";
import Tooltip from "../Tooltip/Tooltip";
import { Help as HelpIcon } from '@material-ui/icons';
declare var paypal: any;

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
    for (let provider of availablePaymentProvider()) {
      let promise = provider.getProducts().then(loadedProducts => {
        products2.push(...loadedProducts);
      });
      promises.push(promise);
    }
    return Promise.all(promises).then(() => {
      let newProducts = groupProductsByDuration(products2);
      products = newProducts;
      setProducts(products);
      setIsLoading(false);
      setTimeout(() => loadPayPalButton(), 100);
    });

  }

  function loadPayPalButton(): void {
    products.forEach(productGroup => {
      productGroup.forEach(product => {
        if (product.paymentProviderName !== 'paypal') return;
        let el = document.querySelector('#paypal-button' + product.itemId);
        if (!el) {
          setTimeout(() => loadPayPalButton(), 100);
          return;
        }
        el.innerHTML = "";
        let btn = paypal.Buttons({
          createOrder: function (data, actions) {
            return actions.order.create({
              purchase_units: [{
                amount: {
                  value: product.price.value
                }
              }]
            });
          },
          onApprove: function (data, actions) {
            return actions.order.capture().then(function (details) {

              if (product.premiumDuration) {
                api.paypalPurchase(details.id, product.premiumDuration).then(response =>
                  history.push({
                    pathname: "/success"
                  })
                ).catch(error =>
                  history.push({
                    pathname: "/cancel"
                  })
                )
              } else {
                toast.error("An Error occoured while trying to pay with paypal");
              }
            });
          }
        });
        btn.render('#paypal-button' + product.itemId);
      })
    })
  }

  const roundToTwo = (param: number): number => Math.round(param * 10 ** 2) / 10 ** 2;


  const onPay = (product: Product) => {
    let provider = availablePaymentProvider().find(provider => provider?.name === product.paymentProviderName);
    provider?.pay(product);
  }

  let planList = products.map(productGroup => {
    return (
      <Card key={generateUUID()} className="premium-plan-card">
        <Card.Header>
          <h4>{productGroup[0].title}</h4>
        </Card.Header>
        <Card.Body>
          {productGroup.map((product, i) => {
            return (
              <div key={product.itemId}>
                <span className="premium-price">Price: {roundToTwo(product.price.value)}</span>
                <p className="premium-price">Price: {roundToTwo(product.price.value)}
                  {product?.paymentProviderName === 'paypal' ? <Tooltip content={<span style={{ marginLeft: "5px" }}><HelpIcon /></span>} type="hover" tooltipContent={<p>Higher price than with credit card due to higher fees</p>} /> : ""}
                </p>
                {
                  product?.paymentProviderName === 'paypal' ?
                    <div style={{ position: "relative", zIndex: 0 }}>
                      <div id={"paypal-button" + product.itemId}></div>
                    </div> :
                    <Button variant="success" onClick={() => { onPay(product) }}>
                      Buy with credit card
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
              <h3>Premium-Plans</h3>
              {planList}
            </div>
          )
      }
    </div >
  )
}

export default Payment;