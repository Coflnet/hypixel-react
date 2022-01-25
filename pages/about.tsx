import React, { ChangeEvent, useEffect } from 'react';
import { Button, Card, Container, Form } from 'react-bootstrap';
import NavBar from '../components/NavBar/NavBar';
import Cookies from 'js-cookie'
import { useMatomo } from '@datapunt/matomo-tracker-react'
import cacheUtils from '../utils/CacheUtils';

function ItemDetails() {

    const { pushInstruction } = useMatomo()

    useEffect(() => {
        document.title = "About";
    })

    function setTrackingAllowed(event: ChangeEvent<HTMLInputElement>) {
        let val = event.target.checked;
        if (val) {
            pushInstruction("rememberConsentGiven");
            Cookies.set('nonEssentialCookiesAllowed', "true");
        } else {
            pushInstruction("forgetConsentGiven");
            Cookies.set('nonEssentialCookiesAllowed', false);
        }
    }

    function isTrackingAllowed() {
        let cookie = Cookies.get('nonEssentialCookiesAllowed');
        return cookie === "true"
    }

    function deleteCaches() {
        cacheUtils.clearAll();
        document.cookie = "";
        localStorage.clear();
        sessionStorage.clear();
        window.location.reload(true);
    }

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
                    <hr />
                    <h3>Our API</h3>
                    <p><a href="https://sky.coflnet.com/api">https://sky.coflnet.com/api</a></p>
                    <p>If you use it please link to <a href="https://sky.coflnet.com/data">https://sky.coflnet.com/data</a></p>
                    <hr />
                    <h2>Credits</h2>
                    <h3>Player Heads</h3>
                    <p>Are provided by <a href="https://mc-heads.net/">mc-heads</a> and <a href="https://craftatar.com">craftatar</a></p>
                    <hr />
                    <h3>Item icons</h3>
                    <div>
                        The item textures are provided by <a href="https://sky.shiiyu.moe/">SkyCrypt</a>.
                        Internally they use the work of these amazing people.

                        <p><a href="https://minecraft.net/" target="_blank" rel="noreferrer">Vanilla </a>by Mojang</p>

                        <p><a href="https://hypixel.net/threads/4101579" target="_blank" rel="noreferrer">FurfSky Reborn <small>v1.3</small></a> by The Reborn Team</p>

                        <p><a href="https://hypixel.net/threads/3470904" target="_blank" rel="noreferrer">RNBW+ <small>v0.6</small></a> by rainbowcraft2</p>

                        <p><a href="https://hypixel.net/threads/2103515" target="_blank" rel="noreferrer">Hypixel Skyblock Pack <small>v13</small></a> by Packs HQ</p>

                        <p><a href="https://hypixel.net/threads/2138599" target="_blank" rel="noreferrer">FurfSky+ <small>v1.71</small></a> by Furf__</p>

                        <p><a href="https://hypixel.net/threads/2147652" target="_blank" rel="noreferrer">Vanilla+ <small>v1.39</small></a> by TBlazeWarriorT</p>

                        <p><a href="https://hypixel.net/threads/worlds-and-beyond-16x-crystal-hollows-update-version-1-5.3597207/" target="_blank" rel="noreferrer">Worlds and Beyond [16x] <small>v1.5</small></a> by Skeletony</p>
                    </div>
                    <hr />
                    <h3>Data / API</h3>
                    <p><a href="https://hypixel.net">Hypixel</a></p>
                    <hr />
                    <h3>Crafts Data</h3>
                    <p><a href="https://github.com/NotEnoughUpdates/NotEnoughUpdates-REPO">NEU</a></p>
                    <hr />
                    <h2>Legal</h2>
                    <p>We are not affiliated with Mojang nor HyPixel</p>
                    <p><a href="https://coflnet.com/legal">Terms of use</a></p>
                    <p><a href="https://coflnet.com/privacy">Privacy</a></p>
                    <p><a href="https://coflnet.com/impressum">Imprint</a></p>
                    <hr />
                    <p style={{ marginBottom: "0px" }}><label>Allow cookies for tracking: </label><Form.Check style={{ display: "inline", marginLeft: "15px" }} onChange={setTrackingAllowed} defaultChecked={isTrackingAllowed()} type="checkbox" /></p>
                    <hr />
                    <Button variant="danger" onClick={deleteCaches}>Delete Caches/Cookies and hard refresh.</Button>
                    <p style={{ color: "red" }}>Caution: Deleting your Caches/Cookies will delete all your settings and log you out.</p>
                </Card>
            </Container>
        </div >
    );
}

export default ItemDetails;
