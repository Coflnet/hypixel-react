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
    return (<div className="center" style={{ height: '500px' }}>
        <div>
            <img src="/logo192.png" height="192"/>
            <div className="center">
                <span>Loading <Spinner animation="grow" variant="primary" size="sm"></Spinner>
            <Spinner animation="grow" variant="primary" size="sm"></Spinner>
            <Spinner animation="grow" variant="primary" size="sm"></Spinner></span></div>
        </div></div>);
}