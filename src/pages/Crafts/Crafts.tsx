import React, { useEffect } from 'react';
import { Container } from 'react-bootstrap';
import { CraftsList } from '../../components/CraftsList/CraftsList';
import NavBar from '../../components/NavBar/NavBar';
import './Crafts.css';

function Crafts() {

    useEffect(() => {
        document.title = "Crafts";
    }, [])

    return (
        <div className="crafts-page">
            <Container>
                <h2>
                    <NavBar />
                    Profitable crafts
                </h2>
                <hr />
                <CraftsList />
            </Container>
        </div >
    );
}

export default Crafts;
