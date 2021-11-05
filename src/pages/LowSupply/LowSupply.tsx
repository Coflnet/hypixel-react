import React from 'react';
import { Container } from 'react-bootstrap';
import './LowSupply.css'
import NavBar from '../../components/NavBar/NavBar';
import LowSupplyList from '../../components/LowSupplyList/LowSupplyList';

function LowSupply() {

    return (
        <div className="low-supply-page">
            <Container>
                <h2>
                    <NavBar />
                    Low supply items
                </h2>
                <hr />
                <p>These are low supply items. Strong price fluctuation may occur.</p>
                <LowSupplyList />
            </Container>
        </div>
    );
}

export default LowSupply;