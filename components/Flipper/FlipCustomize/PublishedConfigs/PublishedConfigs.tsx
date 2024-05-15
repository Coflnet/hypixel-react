import { useEffect, useState } from 'react'
import api from '../../../../api/ApiHelper'
import { Button, Form, ListGroup, ListGroupItem, Modal } from 'react-bootstrap'
import Tooltip from '../../../Tooltip/Tooltip'
import { toast } from 'react-toastify'

const PublishedConfigs = () => {
    const [configs, setConfigs] = useState<string[]>([])
    const [changeNotes, setChangeNotes] = useState<{ config: string; changeNotes: string }[]>([])

    useEffect(() => {
        loadConfigs()
    }, [])

    async function loadConfigs() {
        const configs = await api.getPublishedConfigs()
        setConfigs(configs)
    }

    async function updateConfig(configName: string, updateNotes: string = '') {
        try {
            await api.updateConfig(configName, updateNotes)
            toast.success(`Updated config`)
        } catch (e) {
            toast.error(`Failed to update config`)
        }
    }

    if (!configs || configs.length === 0) {
        return <></>
    }

    return (
        <>
            <h5>Update published configs</h5>
            <ListGroup>
                {configs.map((configName, i) => (
                    <ListGroupItem key={i} style={{ display: 'flex', gap: 15 }}>
                        <span style={{ flex: 1 }}>{configName}</span>
                        <Form.Control
                            style={{ flex: 2 }}
                            type="text"
                            placeholder="Change notes"
                            onChange={event => {
                                let newChangeNotes = [...changeNotes]
                                let index = newChangeNotes.findIndex(changeNote => changeNote.config === configName)

                                if (index === -1) {
                                    newChangeNotes.push({ config: configName, changeNotes: event.target.value })
                                } else {
                                    newChangeNotes[index].changeNotes = event.target.value
                                }

                                setChangeNotes(newChangeNotes)
                            }}
                        />
                        <Button
                            variant="success"
                            onClick={() => {
                                updateConfig(configName, changeNotes.find(changeNote => changeNote.config === configName)?.changeNotes)
                            }}
                        >
                            Update
                        </Button>
                    </ListGroupItem>
                ))}
            </ListGroup>
        </>
    )
}

export default PublishedConfigs
