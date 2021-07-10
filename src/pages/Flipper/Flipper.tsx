import React, { useEffect } from 'react';
import './Flipper.css';
import FlipperComponent from '../../components/Flipper/Flipper';
import NavBar from '../../components/NavBar/NavBar';
import { Container } from 'react-bootstrap';

function Flipper() {

    useEffect(() => {
        document.title = "Auction flipper for hypixel skyblock";
    })

    return (
        <div className="flipper">
            <Container>
                <h2>
                    <NavBar />
                    Item-Flipper (WIP)
                </h2>
                <hr />
                <FlipperComponent />
            </Container>
        </div >
    );
}

export default Flipper;