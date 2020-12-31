import React from 'react';
import { Spinner } from "react-bootstrap";

export function getLoadingElement(): JSX.Element {
    return (<div style={{textAlign: 'center'}}>
        <span><Spinner animation="grow" variant="primary"></Spinner>
            <Spinner animation="grow" variant="primary"></Spinner>
            <Spinner animation="grow" variant="primary"></Spinner></span>
        <p>Loading Data...</p></div>);
}