import { useEffect, useState } from 'react'
import { Badge, Button, Card, Form, Modal } from 'react-bootstrap'
import ItemFilter from '../../ItemFilter/ItemFilter'
import ItemFilterPropertiesDisplay from '../../ItemFilter/ItemFilterPropertiesDisplay'
import { getItemFilterFromUrl } from '../../../utils/Parser/URLParser'
import api from '../../../api/ApiHelper'

interface Props {
    itemTag: string
    show: boolean
    filter: ItemFilter
    onShowChange: (show: boolean) => void
}

function ExportArchivedData(props: Props) {
    let [showModal, setShowModal] = useState(props.show)
    let [discordWebhookUrl, setDiscordWebhookUrl] = useState<string>('')

    useEffect(() => {
        setShowModal(props.show)
    }, [props.show])

    function onExportClick() {
        api.exportArchivedAuctionsData(props.itemTag, props.filter, discordWebhookUrl).then(() => {
            setShowModal(false)
            props.onShowChange(false)
        })
    }

    return (
        <Modal
            show={showModal}
            onHide={() => {
                setShowModal(false)
                props.onShowChange(false)
            }}
            size="lg"
        >
            <Modal.Header closeButton>
                <h4>Export Archived Data</h4>
            </Modal.Header>
            <Modal.Body>
                <p>Export auction history to a CSV file that you can import into Excel or other programs.</p>
                <div style={{ marginBottom: '15px' }}>
                    <p>
                        Clicking start export will deduct a one time CoflCoin fee of 1500 to unlock the export of the item for you. This helps to keep the the
                        amount of different items low and exports quicker. The file will be sent to the Discord Webhook provided below.
                    </p>
                    <Form.Control defaultValue={discordWebhookUrl} onChange={e => setDiscordWebhookUrl(e.target.value)} placeholder="Discord Webhook" />
                </div>

                <p>Please check the filters you want to get data for</p>
                <Card bg="secondary">
                    <Card.Body>
                        <ItemFilterPropertiesDisplay filter={props.filter} isEditable={false} />
                    </Card.Body>
                </Card>
                <p>
                    Each export will contain up to 1000 auctions matching your filter. You can choose to Add social information of the auction buyer, a check if
                    the item is in the players inventory and in which inventory (talisman,armor,backpack etc) and wherever or not to only return the last sale
                    of each item.
                </p>
                <Button onClick={onExportClick}>Start Export</Button>
            </Modal.Body>
        </Modal>
    )
}

export default ExportArchivedData
