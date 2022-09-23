import React, { useEffect, useState } from 'react'
import { Modal } from 'react-bootstrap'
import api from '../../api/ApiHelper'
import { getStyleForTier } from '../../utils/Formatter'
import TEMInventory from './TEMInventory/TEMInventory'
import TEMItemDetails from './TEMItemDetails/TEMItemDetails'

interface Props {
    playerUUID: string
}

function TEMItems(props: Props) {
    let [playerData, setPlayerData] = useState<TEM_Player>()
    let [detailEntry, setDetailEntry] = useState<TEM_Item | TEM_Pet>()
    let [detailEntryType, setDetailEntryType] = useState<'pet' | 'item'>()

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
        return Object.keys(grouped).map(location => (
            <TEMInventory
                title={location}
                type={type}
                entries={grouped[location]}
                onEntryClick={entry => {
                    setDetailEntry(entry)
                    setDetailEntryType(type === 'items' ? 'item' : 'pet')
                }}
            />
        ))
    }

    let detailDialog = !!detailEntry ? (
        <Modal
            size={'xl'}
            show={!!detailEntry}
            onHide={() => {
                setDetailEntry(null)
            }}
        >
            <Modal.Header closeButton>
                <Modal.Title>Item-Details</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <TEMItemDetails detailEntry={detailEntry} type={detailEntryType} />
            </Modal.Body>
        </Modal>
    ) : null

    return (
        <>
            {playerData ? getEntryList(playerData.items, 'items') : null}
            <hr />
            {playerData ? getEntryList(playerData.pets, 'pets') : null}
            {detailDialog}
        </>
    )
}

export default TEMItems
