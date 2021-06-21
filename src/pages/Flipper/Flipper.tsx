import React from 'react';
import './Flipper.css';
import FlipperComponent from '../../components/Flipper/Flipper';
import NavBar from '../../components/NavBar/NavBar';
import { Container } from 'react-bootstrap';

function Flipper() {

    return (
        <div className="flipper">
            <Container>
                <h1>
                    <NavBar />
                Item-Flipper (WIP)
            </h1>
                <FlipperComponent />
            </Container>
        </div >
    );
}

export default Flipper;