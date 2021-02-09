import React, { useEffect, useState } from "react";
import { Button } from 'react-bootstrap';
import AbstractPaymentProvider from "../../utils/Payment/AbstractPaymentProvider";
import availablePaymentProvider from "../../utils/Payment/PaymentUtils";

let paymentProvider: AbstractPaymentProvider;

function Payment() {

  let [productListJsx, _setProductListJsx] = useState<JSX.Element>();

  const setProductsListJsx = (jsx: JSX.Element) => {
    if (productListJsx !== jsx) {
      productListJsx = jsx;
      _setProductListJsx(productListJsx);
    }
  }

  const getProducts = async () => {
    if (!paymentProvider) {
      paymentProvider = await availablePaymentProvider();
    }
    return await paymentProvider.getProducts();
  }

  const getProductsJsx = async (): Promise<JSX.Element> => {
    const products = await getProducts();
    return (
      <div className="container px-1 py-1">
        <div className="row justify-content-center">
          <div className="col-7">
            <b>Title</b>
          </div>
          <div className="col-2">
            <b>Price</b>
          </div>
          <div className="col-3">
          </div>
        </div>
        {products.map(product => <div className="row justify-content-center" key={product.itemId}>
          <div className="col-7">
            {product.title}
          </div>
          <div className="col-2">
            {(() => product.price.value.toFixed(2))()}
          </div>
          <div className="col-3">
            <Button onClick={() => {onPay(product)}}>
              Buy
            </Button>
          </div>
        </div>)
        }
      </div>
    )
  }


  const onPay = async (product: Product) => {
    paymentProvider.pay(product);
  }

  const setProductsJsx = async () => setProductsListJsx(await getProductsJsx())

  useEffect(() => { setProductsJsx() }, []);

  return (
    <div>
      {productListJsx}
    </div>
  )
}

export default Payment;