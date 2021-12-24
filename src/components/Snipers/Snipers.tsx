import React from 'react';
import { Button, Card } from 'react-bootstrap';
import { toast } from 'react-toastify';
import api from '../../api/ApiHelper';
import './Snipers.css';

export function Snipers() {

    function getSniperElement(label: string, price: number, estimatedSpeed: number, cpu: string, network: string, productId: string) {
        return <Card className="sniper-product">
            <Card.Header>
                <h3 className="sniper-product-label">{label}</h3>
            </Card.Header>
            <Card.Body>
                <h1 style={{ textAlign: "center" }}>{price.toFixed(2)}€</h1>
                <hr />
                <p>{estimatedSpeed}s on average per auction house scan</p>
                <hr />
                <p>{cpu}</p>
                <hr />
                <p>{network}</p>
                <hr />
                <Button type="success" onClick={() => { onSniperBuy(productId) }}>Buy Sniper (1h)</Button>
            </Card.Body>
        </Card>
    }

    function onSniperBuy(productId: string) {
        api.purchaseWithCoflcoins(productId).then(() => {
            toast.success(<span><h4>Purchase successfull</h4><p>You now get flips found by the sniper</p></span>)
        })
    }

    return (
        <div className="snipers">
            <div className="sniper-products">
                {getSniperElement("Normal", 0.79, 1.09, "4 core cpu", "50Gbit Download", "sniper_1")}
                {getSniperElement("Faster", 1.20, 0.63, "8 core cpu", "50Gbit Download", "sniper_2")}
                {getSniperElement("Allrounder", 1.34, 0.58, "8 core cpu", "50Gbit Download", "sniper_3")}
                {getSniperElement("Ultra Fast", 2.36, 0.48, "30 core cpu", "50Gbit Download", "sniper_4")}
                {getSniperElement("Cloud-Sniper", 4.99, 0.01, "60 core cpu", "50Gbit Download", "sniper_5")}
            </div>
        </div>
    )
}