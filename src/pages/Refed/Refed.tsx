import React from "react";
import { Button, Container, Card } from "react-bootstrap";
import { Link } from 'react-router-dom';
import { toast } from "react-toastify";
import GoogleSignIn from "../../components/GoogleSignIn/GoogleSignIn";
import Search from "../../components/Search/Search";
import './Refed.css';

function Refed() {

    function onAfterLogin() {
        
    }

    return (
        <div className="refed">
            <Container>
                <Search />
                <Card>
                    <Card.Header>
                        <Card.Title>Invitation</Card.Title>
                    </Card.Header>
                    <Card.Body>
                        <p>You were invited to use this application because someone thought it would be interesting and helpful to you.</p>
                        <p>We hope you will enjoy our service.</p>
                        <p>As a welcome gift you can received 1 day of premium to test out our premium features. You can check out all the features and your remaining time <Link to="/premium">here</Link>.</p>
                        <hr />
                        <p>To get access to the free premium day you have to login with google:</p>
                        <GoogleSignIn onAfterLogin={onAfterLogin} />
                        <Link to="/"><Button>Go to main page</Button></Link>
                    </Card.Body>
                </Card>
            </Container>
        </div>
    )
}

export default Refed;