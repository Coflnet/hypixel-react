import { useState } from 'react'
import api from '../../../../api/ApiHelper'
import { useWasAlreadyLoggedIn } from '../../../../utils/Hooks'
import GoogleSignIn from '../../../GoogleSignIn/GoogleSignIn'
import { Button, Form, ListGroup, ListGroupItem } from 'react-bootstrap'
import { toast } from 'react-toastify'

const PublishedConfigs = () => {
    const [configs, setConfigs] = useState<string[]>([])
    const [changeNotes, setChangeNotes] = useState<{ config: string; changeNotes: string }[]>([])
    const wasAlreadyLoggedIn = useWasAlreadyLoggedIn()

    // published configs belong to an account, so they are only requested once the login is done
    async function loadConfigs() {
        try {
            setConfigs(await api.getPublishedConfigs())
        } catch {
            // the api helper already reported the error, the section stays hidden
        }
    }

    const signIn = wasAlreadyLoggedIn ? (
        <div style={{ visibility: 'collapse', height: 0 }}>
            <GoogleSignIn onAfterLogin={loadConfigs} />
        </div>
    ) : null

    async function updateConfig(configName: string, updateNotes: string = '') {
        try {
            await api.updateConfig(configName, updateNotes)
            toast.success(`Updated config`)
        } catch {
            toast.error(`Failed to update config`)
        }
    }

    async function loadConfig(configName: string) {
        try {
            await api.loadConfig(configName)
            window.location.reload()
        } catch {
            toast.error(`Failed to load config`)
        }
    }

    if (!configs || configs.length === 0) {
        return signIn
    }

    return (
        <>
            {signIn}
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
                                const newChangeNotes = [...changeNotes]
                                const index = newChangeNotes.findIndex(changeNote => changeNote.config === configName)

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
                        <Button
                            onClick={() => {
                                loadConfig(configName)
                            }}
                        >
                            Load config
                        </Button>
                    </ListGroupItem>
                ))}
            </ListGroup>
        </>
    )
}

export default PublishedConfigs
