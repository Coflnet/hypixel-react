import React from 'react';
import { Button, Container } from 'react-bootstrap';
import NavBar from '../../components/NavBar/NavBar';
import './Feedback.css';

function Feedback() {

    return (
        <div className="feedback-page">
            <Container>
                <h2>
                    <NavBar />
                    Feedback
                </h2>
                <hr />
                <div>
                    <p>Hey, we are only a small group of developers. We develop this app in our spare time and try to create a usefull application for all the Skyblock players.</p>
                    <p>Therefore your feedback would be very well appreciated. If found something that bothers you or if you have an idea for an improvement please tell us. </p>
                    <p>We will try to use your feedback to improve the experience for all the Skyblock players who use this application.</p>
                    <p>Thank you very much.</p>
                    <a href="mailto:support@coflnet.com"><Button>Send feedback</Button></a>
                    <hr />
                    <h4>Contact: </h4>
                    <a href="mailto:support@coflnet.com">support@coflnet.com</a>
                    <a href="https://discord.gg/Qm55WEkgu6">Discord</a>
                </div>
            </Container>
        </div >
    );
}

export default Feedback;
