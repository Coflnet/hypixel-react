import React from "react";
import { Button, Container } from "react-bootstrap";
import { Link } from 'react-router-dom';
import './PaymentSuccess.css';

function Success() {
    return (
        <div className="payment-success">
            <Container>
                <h1 style={{color: "limegreen"}}>Your payment was handled successfully</h1>
                <p>You should get your features withiin the next few minutes.</p>
                <p>If any problems should occur please contact us via <Link to="/feedback">the contact page</Link></p>
                <Link to="/"><Button>Return to main page</Button></Link>
            </Container>
        </div>
    )
}

export default Success;