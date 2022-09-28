import React, { ChangeEvent, useEffect, useState } from 'react'
import { Form, Modal } from 'react-bootstrap'
import api from '../../api/ApiHelper'
import { getStyleForTier } from '../../utils/Formatter'
import { getLoadingElement } from '../../utils/LoadingUtils'
import TEMInventory from './TEMInventory/TEMInventory'
import TEMItemDetails from './TEMItemDetails/TEMItemDetails'

interface Props {
    playerUUID: string
}

function TEMItems(props: Props) {
    let [playerData, setPlayerData] = useState<TEM_Player>()
    let [detailEntry, setDetailEntry] = useState<TEM_Item | TEM_Pet>()
    let [detailEntryType, setDetailEntryType] = useState<'pet' | 'item'>()
    let [profiles, setProfiles] = useState<SkyblockProfile[]>()
    let [selectedProfile, setSelectedProfile] = useState<SkyblockProfile>()
    let [isLoading, setIsLoading] = useState<boolean>(true)

    useEffect(() => {
        api.getPlayerProfiles(props.playerUUID).then(profiles => {
            let selectedProfile = profiles.find(profile => profile.current)
            setSelectedProfile(selectedProfile)
            setProfiles(profiles)
            api.getTEMPlayerDataByProfileUUID(selectedProfile.id).then(playerData => {
                setPlayerData(playerData)
                setIsLoading(false)
            })
        })
    }, [props.playerUUID])

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
                playerUUID={props.playerUUID}
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

    function onProfileChange(event: ChangeEvent<HTMLSelectElement>) {
        let selectedIndex = event.target.options.selectedIndex
        let value = event.target.options[selectedIndex].getAttribute('value')!
        let newSelectedProfile = profiles?.find(p => p.cuteName === value)
        setSelectedProfile(newSelectedProfile)
        setIsLoading(true)
        api.getTEMPlayerDataByProfileUUID(newSelectedProfile.id).then(playerData => {
            setPlayerData(playerData)
            setIsLoading(false)
        })
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
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                {profiles ? (
                    <p>
                        <span style={{ float: 'left', marginRight: '15px' }}>Profile: </span>
                        <Form.Control style={{ width: 'auto' }} defaultValue={selectedProfile?.cuteName} as="select" onChange={onProfileChange}>
                            {profiles.map(profile => (
                                <option key={profile.cuteName} value={profile.cuteName}>
                                    {profile.cuteName}
                                </option>
                            ))}
                        </Form.Control>
                    </p>
                ) : null}
            </div>
            {isLoading ? (
                getLoadingElement()
            ) : (
                <div>
                    {playerData ? getEntryList(playerData.items, 'items') : null}
                    <hr />
                    {playerData ? getEntryList(playerData.pets, 'pets') : null}
                    {detailDialog}
                </div>
            )}
        </>
    )
}

export default TEMItems
