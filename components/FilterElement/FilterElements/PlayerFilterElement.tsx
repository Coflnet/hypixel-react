import React, { forwardRef, useState } from 'react'
import { AsyncTypeahead } from 'react-bootstrap-typeahead'
import api from '../../../api/ApiHelper'

import { parsePlayer } from '../../../utils/Parser/APIResponseParser'

interface Props {
    onChange(n: string | Player)
    disabled?: boolean
    returnType: 'name' | 'uuid' | 'player'
    defaultValue: string
    ref?(ref)
    placeholder?: string
}

export let PlayerFilterElement = forwardRef((props: Props, ref) => {
    // for player search
    let [players, setPlayers] = useState<Player[]>([])
    let [isLoading, setIsLoading] = useState(false)

    function _onChange(selected) {
        props.onChange(selected[0] || '')
    }

    function handlePlayerSearch(query) {
        setIsLoading(true)

        api.playerSearch(query).then(players => {
            setPlayers(players)
            setIsLoading(false)
        })
    }

    return (
        <AsyncTypeahead
            id={crypto.randomUUID()}
            disabled={props.disabled}
            filterBy={() => true}
            isLoading={isLoading}
            labelKey="name"
            minLength={1}
            default
            onSearch={handlePlayerSearch}
            defaultInputValue={props.defaultValue}
            options={players}
            placeholder={props.placeholder || 'Search users...'}
            onChange={selected =>
                _onChange(
                    selected.map(s => {
                        if (props.returnType === 'player') {
                            return s
                        }
                        return s[props.returnType]
                    })
                )
            }
            ref={ref}
        />
    )
})
