import React from "react";
import { Link } from 'react-router-dom';

function Success() {
    return (
        <div>
            <h1>Your payment was handled successfully</h1>
            <h2>You should get your features withiin the next few minutes</h2>
            <Link to="/item/ASPECT_OF_THE_END">return to homepage</Link>
        </div>
    )
}

export default Success;