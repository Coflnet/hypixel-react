import React from 'react';
import './Flipper.css';
import FlipperComponent from '../../components/Flipper/Flipper';
import NavBar from '../../components/NavBar/NavBar';

function Flipper() {

    return (
        <div className="flipper">
            <h1>
                <NavBar />
                Item-Flipper (WIP)
            </h1>
            <FlipperComponent />
        </div >
    );
}

export default Flipper;
