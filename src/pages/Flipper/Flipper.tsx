import React, { useEffect } from 'react';
import './Flipper.css';
import FlipperComponent from '../../components/Flipper/Flipper';
import { Container } from 'react-bootstrap';
import Search from '../../components/Search/Search';

function Flipper() {

    useEffect(() => {
        document.title = "Auction flipper for hypixel skyblock";
    })

    return (
        <div className="flipper">
            <Container>
                <Search />
                <h2>
                    Item-Flipper (WIP)
                </h2>
                <hr />
                <FlipperComponent />
            </Container>
        </div >
    );
}

export default Flipper;