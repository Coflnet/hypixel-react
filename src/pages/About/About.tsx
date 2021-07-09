import React, { useEffect } from 'react';
import { Card, Container } from 'react-bootstrap';
import NavBar from '../../components/NavBar/NavBar';
import './About.css';

function ItemDetails() {

    useEffect(() => {
        document.title = "About";
    })

    return (
        <div className="about-page">
            <Container>
                <h2>
                    <NavBar />
                    Links/Legal
                </h2>
                <hr />
                <Card className="about-card">
                    <p>This is an OpenSource project developed on <a href="https://github.com/matthias-luger/hypixel-react">GitHub</a></p>
                    <p>You can support this site by letting it opened and <b>disabling your adblocker</b>. Arc will use some of your bandwith and pay us for that. You can learn more by clicking on the blue icon in the lower left corner. (only there if you disabled your adblocker)</p>
                    <p>Player Heads from <a href="https://mc-heads.net/">mc-heads</a> and <a href="https://craftatar.com">craftatar</a></p>
                    <p>Item icons from <a href="https://sky.lea.moe">sky.lea.moe</a></p>
                    <p>Data from <a href="https://hypixel.net">Hypixel</a></p>
                    <p><a href="https://coflnet.com/legal">Terms of use</a></p>
                    <p><a href="https://coflnet.com/privacy">Privacy</a></p>
                    <p><a href="https://coflnet.com/impressum">Imprint</a></p>
                </Card>
            </Container>
        </div >
    );
}

export default ItemDetails;
