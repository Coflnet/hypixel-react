import React, { useEffect } from 'react';
import { Button, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import './NotFound.css';

function NotFound() {

    useEffect(() => {
        document.title = "Not found";
    })

    return (
        <div className="not-found">
            <Container>
                <h1>Ops, seems something went wrong</h1>
                <p>There is nothing to see here.</p>
                <Link to="/"><Button>Get back</Button></Link>
            </Container>
        </div >
    );
}

export default NotFound;
