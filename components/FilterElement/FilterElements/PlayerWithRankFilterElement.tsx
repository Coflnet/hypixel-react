'use client'
import { useEffect, useRef, useState } from 'react'
import { Form } from 'react-bootstrap'
import Typeahead from 'react-bootstrap-typeahead/types/core/Typeahead'
import { PlayerFilterElement } from '../FilterElements/PlayerFilterElement'

interface Props {
    onChange(n: string)
    defaultValue: string
}

const RANKS = [
    {
        color: '#AAAAAA',
        tag: '[NO_PLAYER]',
        value: ' '
    },
    {
        color: '#AAAAAA',
        tag: '[NO_RANK]',
        value: ' '
    },
    {
        color: '#FF5555',
        tag: '[OWNER]'
    },
    {
        color: '#FF5555',
        tag: '[ADMIN]'
    },
    {
        color: '#00AAAA',
        tag: '[BUILD TEAM]'
    },
    {
        color: '#00AA00',
        tag: '[MOD]'
    },
    {
        color: '#00AA00',
        tag: '[GM]'
    },
    {
        color: '#5555FF',
        tag: '[HELPER]'
    },
    {
        color: '#FF5555',
        tag: '[YOUTUBE]'
    },
    {
        color: '#FFAA00',
        tag: '[MVP++]'
    },
    {
        color: '#55FFFF',
        tag: '[MVP+]'
    },
    {
        color: '#55FFFF',
        tag: '[MVP]'
    },
    {
        color: '#55FF55',
        tag: '[VIP+]'
    },
    {
        color: '#55FF55',
        tag: '[VIP]'
    },
    {
        color: '#FF55FF',
        tag: '[PIG+++]'
    },
    {
        color: '#FF5555',
        tag: '[MINISTER]'
    },
    {
        color: '#FF55FF',
        tag: '[MAYOR]'
    }
]

export function PlayerWithRankFilterElement(props: Props) {
    const [currentRank, setRank] = useState<string>(getDefaultValues()[0])
    let rank = currentRank
    const [currentPlayer, setPlayer] = useState<string>(getDefaultValues()[1])
    let player = currentPlayer

    const playerRef = useRef<Typeahead>(null)

    function getDefaultValues() {
        let splits: string[] = []
        if (props.defaultValue) {
            const s = props.defaultValue.trim().split(']')
            if (s.length === 1) {
                if (props.defaultValue.indexOf(']') !== -1) {
                    splits = [props.defaultValue, '']
                } else {
                    splits = [RANKS[1].tag, props.defaultValue.trim()]
                }
            } else {
                splits = [s[0] + ']', s[1]]
            }
        } else {
            splits = [RANKS[0].tag, '']
        }
        return splits
    }

    useEffect(() => {
        // If there is no default value, call _onChange, so the default is set from here
        // timeout, so the useEffect of the FilterElement-Component is executed first
        if (!props.defaultValue) {
            setTimeout(() => {
                _onChange()
            })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    function _onChange() {
        const rankObject = RANKS.find(r => r.tag === rank)!
        const rankValue = rankObject.value !== undefined ? rankObject.value : rankObject.tag
        props.onChange(rankValue + ' ' + player)
    }

    function _onPlayerChange(uuid) {
        player = uuid
        setPlayer(uuid)
        _onChange()
    }

    function _onRankChange(event) {
        const selectedIndex = event.target.options.selectedIndex
        const _rank = event.target.options[selectedIndex].value
        rank = _rank

        if (RANKS[0].tag === rank) {
            setPlayer('')
            player = ''
            if (playerRef && playerRef.current) {
                ;playerRef.current.clear()
            }
        }

        setRank(_rank)
        _onChange()
    }

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Form.Select style={{ width: '50%', color: RANKS.find(r => r.tag === rank)?.color }} defaultValue={rank} onChange={_onRankChange}>
                {RANKS.map(rank => {
                    return (
                        <option key={rank.tag} value={rank.tag} style={{ color: rank.color }}>
                            {rank.tag}
                        </option>
                    )
                })}
            </Form.Select>
            <div style={{ width: '50%' }}>
                <PlayerFilterElement ref={playerRef} returnType="name" defaultValue={player} onChange={_onPlayerChange} disabled={rank === RANKS[0].tag} />
            </div>
        </div>
    )
}
