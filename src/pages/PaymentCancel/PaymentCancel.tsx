import React from "react";
import { Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

function Cancel() {
    return (
        <div>
            <h1>Your canceled the payment process</h1>
            <h2>If you encountered a problem, feel free to contact us via the <Link to="/feedback">Feedback site</Link></h2>
            <Link to="/"><Button>Back to front page</Button></Link>
        </div>
    )
}

export default Cancel;