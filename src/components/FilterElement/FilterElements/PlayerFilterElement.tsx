import React, { useState } from 'react';
import { AsyncTypeahead } from 'react-bootstrap-typeahead';
import api from '../../../api/ApiHelper';

interface Props {
    key: string,
    onChange(n: string),
    disabled?: boolean
}

export function PlayerFilterElement(props: Props) {

    // for player search
    let [players, setPlayers] = useState<Player[]>([]);
    let [isLoading, setIsLoading] = useState(false);

    function _onChange(selected) {
        props.onChange(selected[0]);
    }

    function handlePlayerSearch(query) {
        setIsLoading(true);

        api.playerSearch(query).then(players => {
            setPlayers(players);
            setIsLoading(false);
        });
    };

    return (
        <AsyncTypeahead
            disabled={props.disabled}
            filterBy={() => true}
            isLoading={isLoading}
            labelKey="name"
            minLength={1}
            onSearch={handlePlayerSearch}
            options={players}
            placeholder="Search users..."
            onChange={selected => _onChange(selected.map(s => s.uuid))}
        />
    )
}