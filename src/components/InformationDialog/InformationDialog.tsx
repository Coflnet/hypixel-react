import React from 'react';
import { Modal } from 'react-bootstrap';
import './InformationDialog.css';

interface Props {
    onClose?(): void
}

function Search(props) {

    return (
        <div className="informationDialog">
            <Modal show={true} onHide={props.onClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Information</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Nice to see you here</p>
                    <p>This is an OpenSource project developed on <a href="https://github.com/matthias-luger/hypixel-react">GitHub</a></p>
                    <p>You can support this site by letting it opened and <b>disabling your adblocker</b>. Arc will use some of your bandwith and pay us for that. You can learn more by clicking on the blue icon in the lower left corner. (only there if you disabled your adblocker)</p>
                    <p>Player Heads from <a href="https://mc-heads.net/">mc-heads</a> and <a href="https://craftatar.com">craftatar</a></p>
                    <p>Item icons from <a href="https://sky.lea.moe">sky.lea.moe</a></p>
                    <p>Data from <a href="https://hypixel.net">Hypixel</a></p>
                    <p><a href="https://coflnet.com/legal">Terms of use</a></p>
                    <p><a href="https://coflnet.com/pricacy">Privacy</a></p>
                    <p><a href="https://coflnet.com/impressum">Imprint</a></p>
                </Modal.Body>
            </Modal>
        </div >
    );
}

export default Search;