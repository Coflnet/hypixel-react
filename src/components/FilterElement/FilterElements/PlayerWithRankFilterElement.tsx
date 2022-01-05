import React, { useState } from 'react';
import { Form } from 'react-bootstrap';
import { PlayerFilterElement } from '../FilterElements/PlayerFilterElement';
import { SimpleEqualFilterElement } from './SimpleEqualFilterElement';

interface Props {
    key: string,
    onChange(n: string),
    defaultValue: any
}

const RANKS = [
    {
        "color": "#AAAAAA",
        "tag": "[NO_PLAYER]"
    }, {
        "color": "#AAAAAA",
        "tag": "[NO_RANK]"
    }, {
        "color": "#FF5555",
        "tag": "[OWNER]"
    }, {
        "color": "#FF5555",
        "tag": "[ADMIN]"
    }, {
        "color": "#00AAAA",
        "tag": "[BUILD TEAM]"
    }, {
        "color": "#00AA00",
        "tag": "[MOD]"
    }, {
        "color": "#00AA00",
        "tag": "[GM]"
    }, {
        "color": "#5555FF",
        "tag": "[HELPER]"
    }, {
        "color": "#FF5555",
        "tag": "[YOUTUBE]"
    }, {
        "color": "#FFAA00",
        "tag": "[MVP++]"
    }, {
        "color": "#55FFFF",
        "tag": "[MVP+]"
    }, {
        "color": "#55FFFF",
        "tag": "[MVP]"
    }, {
        "color": "#55FF55",
        "tag": "[VIP+]"
    }, {
        "color": "#55FF55",
        "tag": "[VIP]"
    }, {
        "color": "#FF55FF",
        "tag": "[PIG+++]"
    }
]

export function PlayerWithRankFilterElement(props: Props) {

    let [rank, setRank] = useState<string>();
    let [player, setPlayer] = useState<string>();

    function _onChange() {
        if (rank && player) {
            props.onChange(rank + " " + player);
        }
    }

    function _onPlayerChange(uuid) {
        player = uuid;
        setPlayer(uuid);
        _onChange();
    }

    function _onRankChange(event) {
        let selectedIndex = event.target.options.selectedIndex;
        let _rank = event.target.options[selectedIndex].getAttribute('data-id')!;
        rank = _rank;
        setRank(_rank);
        _onChange();
    }

    return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <Form.Control style={{ width: "50%" }} defaultValue={RANKS[0].tag} as="select" onChange={_onRankChange}>
                {
                    RANKS.map(rank => {
                        return <option data-id={rank.tag} key={rank.tag} value={rank.tag} style={{ color: rank.color }}>{rank.tag}</option>
                    })
                }
            </Form.Control>
            <div style={{ width: "50%" }}>
                <PlayerFilterElement key={props.key} onChange={_onPlayerChange} disabled={rank === RANKS[0].tag} />
            </div>
        </div>
    )
}