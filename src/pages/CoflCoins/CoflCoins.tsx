import React, { useEffect } from 'react';
import { Container } from 'react-bootstrap';
import CoflCoinsPurchase from '../../components/CoflCoins/CoflCoinsPurchase';
import NavBar from '../../components/NavBar/NavBar';
import './CoflCoins.css';

function CoflCoins() {

    useEffect(() => {
        document.title = "CoflCoins";
    }, [])

    return (
        <div className="cofl-coins-page">
            <Container>
                <h2>
                    <NavBar />
                    CoflCoins
                </h2>
                <hr />
                <CoflCoinsPurchase />
            </Container>
        </div >
    );
}

export default CoflCoins;