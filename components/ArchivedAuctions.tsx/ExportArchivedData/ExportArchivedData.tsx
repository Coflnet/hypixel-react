import { useEffect, useState } from 'react'
import { Badge, Button, Card, Form, Modal } from 'react-bootstrap'
import ItemFilter from '../../ItemFilter/ItemFilter'
import ItemFilterPropertiesDisplay from '../../ItemFilter/ItemFilterPropertiesDisplay'
import { getItemFilterFromUrl } from '../../../utils/Parser/URLParser'
import api from '../../../api/ApiHelper'
import styles from './ExportArchivedData.module.css'
import HelpIcon from '@mui/icons-material/Help'
import Tooltip from '../../Tooltip/Tooltip'
import NumberElement from '../../Number/Number'

interface Props {
    itemTag: string
    show: boolean
    filter: ItemFilter
    onShowChange: (show: boolean) => void
}

function ExportArchivedData(props: Props) {
    let [showModal, setShowModal] = useState(props.show)
    let [discordWebhookUrl, setDiscordWebhookUrl] = useState<string>('')
    let [includeSocialInformation, setIncludeSocialInformation] = useState<boolean>(false)
    let [includeInventoryCheck, setIncludeInventoryCheck] = useState<boolean>(false)
    let [uniqueItems, setUniqueItems] = useState<boolean>(true)
    let [showConfirmDialog, setShowConfirmDialog] = useState(false)
    let [isExportRunning, setIsExportRunning] = useState(false)

    let isDiscordWebhookUrlValid = discordWebhookUrl && discordWebhookUrl.startsWith('https://discord.com/api/webhooks/')

    useEffect(() => {
        setShowModal(props.show)
    }, [props.show])

    function startExport() {
        let flags: string[] = []
        if (includeSocialInformation) {
            flags.push('IncludeSocial')
        }
        if (includeInventoryCheck) {
            flags.push('InventoryCheck')
        }
        if (uniqueItems) {
            flags.push('UniqueItems')
        }

        setIsExportRunning(true)
        api.exportArchivedAuctionsData(props.itemTag, props.filter, discordWebhookUrl, flags)
            .then(() => {
                setShowConfirmDialog(false)
                setShowModal(false)
                props.onShowChange(false)
            })
            .finally(() => {
                setIsExportRunning(false)
            })
    }

    return (
        <>
            <Modal
                show={showModal && !showConfirmDialog}
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
                    <p>Export an auction history as a CSV file that you can import into Excel or other programs.</p>
                    <div style={{ marginBottom: '15px' }}>
                        <p>
                            Clicking start export will deduct a one time CoflCoin fee of <NumberElement number={1500} /> to unlock the export of the item for
                            you. This helps to keep the the amount of different items low and exports quicker. Each export will contain up to{' '}
                            <NumberElement number={1000} /> auctions matching your filter.
                        </p>
                        <hr />
                        <p style={{ margin: 0 }}>The file will be sent to the following Discord Webhook:</p>
                        <Form.Control
                            defaultValue={discordWebhookUrl}
                            onChange={e => setDiscordWebhookUrl(e.target.value)}
                            placeholder="Discord Webhook Url (https://discord.com/api/...)"
                        />
                        {discordWebhookUrl && !discordWebhookUrl?.startsWith('https://discord.com/api/') ? (
                            <div>
                                <span style={{ color: 'red' }}>The Discord Webhook URL has to start with "https://discord.com/api/..."</span>
                            </div>
                        ) : null}
                    </div>
                    <Form.Group>
                        <Form.Label className={styles.label} htmlFor="includeSocialInformation">
                            Include social information
                            <Tooltip
                                type="hover"
                                content={<HelpIcon style={{ color: '#007bff', cursor: 'pointer', marginLeft: 5 }} />}
                                tooltipContent={<span>Add social information of the auction buyer like discord</span>}
                            />
                        </Form.Label>
                        <Form.Check
                            onChange={event => {
                                setIncludeSocialInformation(event.target.checked)
                            }}
                            defaultChecked={includeSocialInformation}
                            id="includeSocialInformation"
                            style={{ display: 'inline' }}
                            type="checkbox"
                        />
                    </Form.Group>
                    <Form.Group>
                        <Form.Label className={styles.label} htmlFor="includeInventoryCheck">
                            Include inventory check
                            <Tooltip
                                type="hover"
                                content={<HelpIcon style={{ color: '#007bff', cursor: 'pointer', marginLeft: 5 }} />}
                                tooltipContent={
                                    <span>
                                        Add a check to see if the item is in the players inventory and in which inventory (talisman, armor, backpack, ...)
                                    </span>
                                }
                            />
                        </Form.Label>
                        <Form.Check
                            onChange={event => {
                                setIncludeInventoryCheck(event.target.checked)
                            }}
                            defaultChecked={includeInventoryCheck}
                            id="includeInventoryCheck"
                            style={{ display: 'inline' }}
                            type="checkbox"
                        />
                    </Form.Group>
                    <Form.Group>
                        <Form.Label className={styles.label} htmlFor="uniqueItems">
                            Only include last sale
                            <Tooltip
                                type="hover"
                                content={<HelpIcon style={{ color: '#007bff', cursor: 'pointer', marginLeft: 5 }} />}
                                tooltipContent={<span>Only return the last sale of each item</span>}
                            />
                        </Form.Label>
                        <Form.Check
                            onChange={event => {
                                setUniqueItems(event.target.checked)
                            }}
                            defaultChecked={uniqueItems}
                            id="uniqueItems"
                            style={{ display: 'inline' }}
                            type="checkbox"
                        />
                    </Form.Group>
                    <hr />
                    <p>Please confirm these are the filters you want to get data for:</p>
                    <Card bg="secondary" style={{ marginBottom: '15px' }}>
                        <Card.Body>
                            <ItemFilterPropertiesDisplay filter={props.filter} isEditable={false} />
                        </Card.Body>
                    </Card>
                    <Button
                        disabled={!isDiscordWebhookUrlValid}
                        onClick={() => {
                            setShowConfirmDialog(true)
                        }}
                    >
                        Start Export for <NumberElement number={1500} /> CoflCoins
                    </Button>
                </Modal.Body>
            </Modal>
            <Modal show={showConfirmDialog} onHide={() => setShowConfirmDialog(false)}>
                <Modal.Header>
                    <Modal.Title>Confirmation</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div>
                        <p>
                            Are you sure you want to start the export for <NumberElement number={1500} /> CoflCoins?
                        </p>
                        <div style={{ display: 'flex', gap: 5, justifyContent: 'space-between' }}>
                            <Button
                                variant="danger"
                                onClick={() => {
                                    setShowConfirmDialog(false)
                                }}
                            >
                                Cancel
                            </Button>
                            <Button disabled={isExportRunning} variant="success" onClick={startExport}>
                                Confirm
                            </Button>
                        </div>
                    </div>
                </Modal.Body>
            </Modal>
        </>
    )
}

export default ExportArchivedData
