'use client'
import { useState } from 'react'
import { Button, Modal } from 'react-bootstrap'
import AddIcon from '@mui/icons-material/Add'
import api from '../../api/ApiHelper'
import Search from '../Search/Search'
import NotifierDialog from '../SubscribeButton/NotifierDialog'

interface Props {
    onAfterSubscribe(): void
}

interface PickedTarget {
    topic: string
    type: 'player' | 'item' | 'bazaar'
}

function NewNotifierButton(props: Props) {
    let [showSearch, setShowSearch] = useState(false)
    let [picked, setPicked] = useState<PickedTarget | null>(null)

    async function onSearchresultClick(item: SearchResultItem) {
        setShowSearch(false)
        if (item.type === 'player') {
            setPicked({ topic: item.id, type: 'player' })
            return
        }
        // item result: figure out whether it trades on the bazaar to pick the right "When" section
        let type: 'item' | 'bazaar' = 'item'
        try {
            let details = await api.getItemDetails(item.id)
            type = details.bazaar ? 'bazaar' : 'item'
        } catch {
            // default to a regular auction-house item notifier
        }
        setPicked({ topic: item.id, type })
    }

    return (
        <>
            <Button variant="primary" onClick={() => setShowSearch(true)}>
                <AddIcon /> New notifier
            </Button>

            <Modal show={showSearch} onHide={() => setShowSearch(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>What do you want to be notified about?</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Search for an item or player to create a notifier for it.</p>
                    <Search hideNavbar hideOptions placeholder="Search item or player..." onSearchresultClick={onSearchresultClick} />
                </Modal.Body>
            </Modal>

            {picked ? (
                <NotifierDialog
                    show={!!picked}
                    onHide={() => setPicked(null)}
                    topic={picked.topic}
                    type={picked.type}
                    onAfterSubscribe={() => {
                        setPicked(null)
                        props.onAfterSubscribe()
                    }}
                />
            ) : null}
        </>
    )
}

export default NewNotifierButton
