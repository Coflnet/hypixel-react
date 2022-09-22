import React, { useEffect, useState } from 'react'
import api from '../../api/ApiHelper'
import TEMInventory from './TEMInventory/TEMInventory'

interface Props {
    playerUUID: string
}

function TEMItems(props: Props) {
    let [playerData, setPlayerData] = useState<TEM_Player>()

    useEffect(() => {
        api.getTEMPlayerData(props.playerUUID).then(data => {
            setPlayerData(data)
        })
    }, [])

    function groupBy(array: any[], key: string) {
        return array.reduce(function (rv, x) {
            ;(rv[x[key]] = rv[x[key]] || []).push(x)
            return rv
        }, {})
    }

    function getEntryList(entries: TEM_Item[] | TEM_Pet[], type: 'items' | 'pets') {
        let grouped = groupBy(entries, 'location')
        return Object.keys(grouped).map(location => <TEMInventory title={location} type={type} entries={grouped[location]} />)
    }

    return (
        <>
            <p>TEM-Data</p>
            {playerData ? getEntryList(playerData.items, 'items') : null}
            <hr />
            {playerData ? getEntryList(playerData.pets, 'pets') : null}
        </>
    )
}

export default TEMItems
