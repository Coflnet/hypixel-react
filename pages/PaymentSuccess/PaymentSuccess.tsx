import React, { useEffect } from "react";
import { Button, Container, Card } from "react-bootstrap";
import { Link } from 'react-router-dom';
import Search from "../../components/Search/Search";
import './PaymentSuccess.css';

function Success() {

    useEffect(() => {
        document.title = "Payment successful";
    })

    return (
        <div className="payment-success">
            <Container>
                <Search />
                <Card>
                    <Card.Header>
                        <Card.Title style={{ color: "#40ff00" }}>Your payment was handled successfully!</Card.Title>
                    </Card.Header>
                    <Card.Body>
                        <p>You will get your features within the next few minutes.</p>
                        <p>If any problems should occur please contact us via <Link to="/feedback">the contact page</Link>.</p>
                        <Link to="/"><Button>Return to main page</Button></Link>
                    </Card.Body>
                </Card>
            </Container>
        </div>
    )
}

export default Success;