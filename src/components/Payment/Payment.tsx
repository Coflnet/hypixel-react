import React, { useEffect, useState } from "react";
import { Button, Card } from 'react-bootstrap';
import { getLoadingElement } from "../../utils/LoadingUtils";
import './Payment.css';
import api from "../../api/ApiHelper";

interface Props {
  hasPremium: boolean
}

function Payment(props: Props) {

  let [products, setProducts] = useState<Product[]>([]);
  let [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function loadProducts() {

    api.getProducts().then(products => {
      setProducts(products);
      setIsLoading(false);
    })
  }

  function onPayPaypal(product) {
    api.paypalPurchase(product).then(data => {
      console.log(data);
    })
  }

  function onPayStripe(product) {
    api.purchaseStripe(product).then(data => {
      console.log(data);
    })
  }

  const roundToTwo = (param: number): number => Math.round(param * 10 ** 2) / 10 ** 2;

  let planList = products.length === 0 ?
    <p>
      you can not buy premium in the android app.
      please check the discord server for more information
    </p> :
    products.map((product, i) => {
      return (
        <Card key={'product-group-' + i} className="premium-plan-card">
          <Card.Header>
            <h4>{product.title}</h4>
          </Card.Header>
          <Card.Body>
            <div key={product.productId}>
              <p className="premium-price">Price: {roundToTwo(product.cost)}</p>
              <div>
                <Button variant="success" style={{ marginRight: "20px" }} onClick={() => { onPayPaypal(product) }}>
                  Buy with PayPal
                </Button>
                <Button variant="success" onClick={() => { onPayStripe(product) }}>
                  Buy with credit card
                </Button>
              </div>
            </div>
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
