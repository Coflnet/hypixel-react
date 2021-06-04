import React from 'react';
import NavBar from '../../components/NavBar/NavBar';
import './Startpage.css'

interface Props {

}

function Startpage(props: Props) {

    return (
        <div className="subscriptions-page">
            <h1>
                <NavBar />
                Your Subscriptions
            </h1>
            <hr />
        </div>
    );
}

export default Startpage;