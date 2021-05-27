import React from 'react';
import './Flipper.css';
import FlipperComponent from '../../components/Flipper/Flipper';
import NavBar from '../../components/NavBar/NavBar';

function Flipper() {

    return (
        <div className="flipper">
            <h4>
                <NavBar />
                Item-Flipper
            </h4>
            <FlipperComponent />
        </div >
    );
}

export default Flipper;
