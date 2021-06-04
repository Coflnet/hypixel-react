import React from 'react';
import { Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import './NotFound.css';

function NotFound() {

    return (
        <div className="not-found">
            <h3>Ops, seems something went wrong</h3>
            <p>There is nothing to see here.</p>
            <Link to="/"><Button>Get back</Button></Link>
        </div >
    );
}

export default NotFound;
