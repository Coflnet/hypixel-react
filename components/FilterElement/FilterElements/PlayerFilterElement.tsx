import React, { forwardRef, useState } from 'react';
import { AsyncTypeahead } from 'react-bootstrap-typeahead';
import api from '../../../api/ApiHelper';
import { v4 as generateUUID } from 'uuid';

interface Props {
    onChange(n: string),
    disabled?: boolean,
    returnType: "name" | "uuid",
    defaultValue: string,
    ref?(ref)
}

export let PlayerFilterElement = forwardRef((props: Props, ref) => {

    // for player search
    let [players, setPlayers] = useState<Player[]>([]);
    let [isLoading, setIsLoading] = useState(false);

    function _onChange(selected) {
        props.onChange(selected[0] || "");
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
            id={generateUUID()}
            disabled={props.disabled}
            filterBy={() => true}
            isLoading={isLoading}
            labelKey="name"
            minLength={1}
            default
            onSearch={handlePlayerSearch}
            defaultInputValue={props.defaultValue}
            options={players}
            placeholder="Search users..."
            onChange={selected => _onChange(selected.map(s => s[props.returnType]))}
            ref={ref}
        />
    )
})