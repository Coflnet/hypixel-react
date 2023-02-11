import React, { useEffect, useRef, useState } from 'react'
import { Form } from 'react-bootstrap'
import { PlayerFilterElement } from '../FilterElements/PlayerFilterElement'

interface Props {
    onChange(n: string)
    defaultValue: any
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
    let [rank, setRank] = useState<string>(getDefaultValues()[0])
    let [player, setPlayer] = useState<string>(getDefaultValues()[1])

    let playerRef = useRef(null)

    function getDefaultValues() {
        let splits: string[] = []
        if (props.defaultValue) {
            let s = props.defaultValue.trim().split(']')
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
        let rankObject = RANKS.find(r => r.tag === rank)!
        let rankValue = rankObject.value !== undefined ? rankObject.value : rankObject.tag
        props.onChange(rankValue + ' ' + player)
    }

    function _onPlayerChange(uuid) {
        player = uuid
        setPlayer(uuid)
        _onChange()
    }

    function _onRankChange(event) {
        let selectedIndex = event.target.options.selectedIndex
        let _rank = event.target.options[selectedIndex].value
        rank = _rank

        if (RANKS[0].tag === rank) {
            setPlayer('')
            player = ''
            if (playerRef && playerRef.current) {
                ;(playerRef.current as any).clear()
            }
        }

        setRank(_rank)
        _onChange()
    }

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Form.Control style={{ width: '50%', color: RANKS.find(r => r.tag === rank)?.color }} defaultValue={rank} as="select" onChange={_onRankChange}>
                {RANKS.map(rank => {
                    return (
                        <option key={rank.tag} value={rank.tag} style={{ color: rank.color }}>
                            {rank.tag}
                        </option>
                    )
                })}
            </Form.Control>
            <div style={{ width: '50%' }}>
                <PlayerFilterElement ref={playerRef} returnType="name" defaultValue={player} onChange={_onPlayerChange} disabled={rank === RANKS[0].tag} />
            </div>
        </div>
    )
}
