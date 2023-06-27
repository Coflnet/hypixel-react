import { forwardRef, Ref, useState } from 'react'
import { AsyncTypeahead } from 'react-bootstrap-typeahead'
import api from '../../../api/ApiHelper'
import { v4 as generateUUID } from 'uuid'
import Typeahead from 'react-bootstrap-typeahead/types/core/Typeahead'
interface Props {
    onChange(n: string | Player)
    disabled?: boolean
    returnType: 'name' | 'uuid' | 'player'
    defaultValue: string
    ref?(ref)
    placeholder?: string
    isValid?: boolean
}

export let PlayerFilterElement = forwardRef((props: Props, ref: Ref<Typeahead>) => {
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
            id={generateUUID()}
            disabled={props.disabled}
            filterBy={() => true}
            isLoading={isLoading}
            labelKey="name"
            minLength={1}
            isInvalid={!props.isValid}
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
