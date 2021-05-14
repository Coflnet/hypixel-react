import React from 'react';
import { Spinner } from "react-bootstrap";

export function getLoadingElement(): JSX.Element {
    return (<div style={{ textAlign: 'center' }}>
        <span><Spinner animation="grow" variant="primary"></Spinner>
            <Spinner animation="grow" variant="primary"></Spinner>
            <Spinner animation="grow" variant="primary"></Spinner></span>
        <p>Loading Data...</p></div>);
}

export function getInitialLoadingElement(): JSX.Element {
    return (<div className="main-loading" style={{height: "500px"}}>
        <div>
            <img src="/logo192.png" alt="auction house logo" height="192" width="192" />
            <div className="main-loading">Loading App</div>
        </div>
    </div>);
}