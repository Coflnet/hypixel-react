import React from "react";
import { Button, Col, Container, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import './PaymentCancel.css';

function Cancel() {
    return (
        <div className="payment-cancel">
            <Container>
                <Row>
                    <Col>
                        <h1 style={{color: "firebrick"}}>Your canceled the payment process</h1>
                        <p>It seems you decided to not buy premium. We are sorry to hear that. Maybe you will change your mind in the future :)</p>
                        <p>If you encountered a problem, feel free to contact us via the <Link to="/feedback">Feedback site</Link></p>
                        <Link to="/"><Button>Back to the main page</Button></Link>
                    </Col>
                </Row>
            </Container>
        </div>
    )
}

export default Cancel;