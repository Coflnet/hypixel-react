import React, { useEffect } from 'react';
import { Container } from 'react-bootstrap';
import NavBar from '../../components/NavBar/NavBar';
import { Snipers } from '../../components/Snipers/Snipers';
import './Snipers.css';

function SnipersPage() {

    useEffect(() => {
        document.title = "Snipers";
    }, [])

    return (
        <div className="snipers-page">
            <Container>
                <h2>
                    <NavBar />
                    Snipers
                </h2>
                <hr />
                <Snipers />
            </Container>
        </div >
    );
}

export default SnipersPage;