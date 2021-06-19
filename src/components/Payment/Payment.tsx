import React, { useEffect, useState } from "react";
import { Button, Card } from 'react-bootstrap';
import { getLoadingElement } from "../../utils/LoadingUtils";
import availablePaymentProvider from "../../utils/Payment/PaymentUtils";
import './Payment.css';
import { v4 as generateUUID } from 'uuid';
declare var paypal: any;

interface Props {
  hasPremium: boolean
}

function Payment(props: Props) {

  let [products, setProducts] = useState<Product[]>([]);
  let [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function loadProducts(): Promise<void> {
    return availablePaymentProvider().getProducts().then(products => {
      setProducts(products);
      setIsLoading(false);
    })
  }

  const roundToTwo = (param: number): number => Math.round(param * 10 ** 2) / 10 ** 2;


  const onPay = (product: Product) => {
    availablePaymentProvider().pay(product);
  }

  let planList = products.map(product => {
    setTimeout(() => {

    paypal.Buttons({
      createOrder: function (data, actions) {
        return actions.order.create({
          purchase_units: [{
            amount: {
              value: '0.01'
            }
          }]
        });
      },
      onApprove: function (data, actions) {
        return actions.order.capture().then(function (details) {
          alert('Transaction completed by ' + details.payer.name.given_name);
        });
      }
    }).render('#paypal-button');
    console.log(availablePaymentProvider());
    }, 2000);
    return (
      <Card key={generateUUID()} className="premium-plan-card">
        <Card.Header>
          <h4>{product.title}</h4>
        </Card.Header>
        <Card.Body>
          <h5><span className="premium-price">Price: {roundToTwo(product.price.value)}</span>
            {availablePaymentProvider() ?
              <Button variant="success" onClick={() => { onPay(product) }}>
                Buy
              </Button> :
              <div id="paypal-button"></div>
            }
          </h5>
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