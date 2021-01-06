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
                    <p><a href="https://coflnet.com/legal">Terms of use</a></p>
                    <p><a href="https://coflnet.com/pricacy">Privacy</a></p>
                </Modal.Body>
            </Modal>
        </div >
    );
}

export default Search;