import React, { useEffect, useState } from "react";
import { Button } from 'react-bootstrap';
import availablePaymentProvider from "../../utils/Payment/PaymentUtils";
import './Payment.css';

function Payment() {

  let [productListJsx, _setProductListJsx] = useState<JSX.Element>();

  useEffect(() => { setProductsJsx() }, []);

  const setProductsListJsx = (jsx: JSX.Element) => {
    if (productListJsx !== jsx) {
      productListJsx = jsx;
      _setProductListJsx(productListJsx);
    }
  }

  const getProducts = (): Promise<Product[]> => {
    return availablePaymentProvider().getProducts();
  }

  const getProductsJsx = (): Promise<JSX.Element> => {
    return new Promise((resolve, reject) => {
      getProducts().then(products => {
        resolve(
          <div className="product-grid">
              <div className="product-column product-column-title product-column-header">
                <b>Title</b>
              </div>
              <div className="product-column product-column-price product-column-header">
                <b>Price</b>
              </div>
              <div className="product-column product-column-buy-button product-column-header">
              </div>
            {products.map(product => <div key={product.itemId} className="product-wrapper">
              <div className="product-column product-column-title">
                {product.title}
              </div>
              <div className="product-column product-column-price">
                {roundToTwo(product.price.value)}
              </div>
              <div className="product-column product-column-buy-button">
                <Button onClick={() => {onPay(product)}}>
                  Buy
                </Button>
              </div>
            </div>)
            }
          </div>
        )
      });
    });
  }

  const roundToTwo = (param: number): number => Math.round(param * 10 ** 2) / 10 ** 2;


  const onPay = (product: Product) => {
    availablePaymentProvider().pay(product);
  }

  const setProductsJsx = () => getProductsJsx().then(jsx => setProductsListJsx(jsx))

  return (
    <div>
      {productListJsx}
    </div>
  )
}

export default Payment;