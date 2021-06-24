import React, { useEffect, useState } from "react";
import { Button, Card } from 'react-bootstrap';
import { getLoadingElement } from "../../utils/LoadingUtils";
import availablePaymentProvider, { groupProductsByDuration } from "../../utils/Payment/PaymentUtils";
import './Payment.css';
import { v4 as generateUUID } from 'uuid';
import PayPalProvider from "../../utils/Payment/PayPalProvider";
import api from "../../api/ApiHelper";
declare var paypal: any;

interface Props {
  hasPremium: boolean
}

function Payment(props: Props) {

  let [products, setProducts] = useState<Product[][]>([]);
  let [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function loadProducts(): Promise<void> {
    let products: Product[] = [];
    let promises: Promise<void>[] = [];
    for (let provider of availablePaymentProvider()) {
      let promise = provider.getProducts().then(loadedProducts => {
        products.push(...loadedProducts);
      });
      promises.push(promise);
    }
    return Promise.all(promises).then(() => {
      setProducts(groupProductsByDuration(products));
      setIsLoading(false);
    });
  }

  function loadPayPalButton(products: Product[][]): void {
    products.forEach(productGroup => {
      productGroup.forEach(product => {
        if (product.paymentProviderName !== 'paypal') return;
        let el = document.querySelector('#paypal-button' + product.itemId);
        if (!el) {
          setTimeout(() => loadPayPalButton(products), 100);
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
                  window.location.href = '/success'
                ).catch(error => 
                  window.location.href = '/cancel'
                )
              } else {
                // has to be true, paypal always has premiumDuration
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
                {
                  product?.paymentProviderName === 'paypal' ?
                    <div id={"paypal-button" + product.itemId}></div> :
                    <Button variant="success" onClick={() => { onPay(product) }}>
                      Buy with credit card
                    </Button>
                }
                {
                  i < productGroup.length - 1 ? <hr/> : <div></div>
                }
              </div>
            )
          })
        }
        </Card.Body>
      </Card>)
  })

  loadPayPalButton(products);

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