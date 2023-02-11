import React from 'react'
import { Spinner } from 'react-bootstrap'

export function getLoadingElement(text?: JSX.Element): JSX.Element {
    return (
        <div style={{ textAlign: 'center' }}>
            <span>
                <Spinner animation="grow" variant="primary"></Spinner>
                <Spinner animation="grow" variant="primary"></Spinner>
                <Spinner animation="grow" variant="primary"></Spinner>
            </span>
            {text ? text : <p>Loading Data...</p>}
        </div>
    )
}

export function getInitialLoadingElement(): JSX.Element {
    return (
        <div className="main-loading" style={{ height: '500px' }}>
            <div>
                <img src="/logo192.png" height="192" width="192" alt="auction house logo" />
                <div className="main-loading">
                    <span>Loading App...</span>
                </div>
            </div>
        </div>
    )
}
