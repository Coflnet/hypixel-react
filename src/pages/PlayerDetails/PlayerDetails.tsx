import React, { useState } from 'react';
import Search from '../../components/Search/Search';
import './PlayerDetails.css';
import { useParams } from 'react-router-dom';

function PlayerDetails() {

    let { uuid } = useParams();
    let [player, setPlayer] = useState<Player>();

    return (
        <div className="player-details">
            <Search selected={player} />
            <h1>PlayerDetails</h1>
        </div >
    );
}

export default PlayerDetails;
