import { useEffect, useState } from 'react'
import { Badge, Modal } from 'react-bootstrap'

interface Props {
    show: boolean
    onShowChange: (show: boolean) => void
}

function ExportArchivedData(props: Props) {
    let [showModal, setShowModal] = useState(props.show)

    useEffect(() => {
        setShowModal(props.show)
    }, [props.show])

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
                <p>
                    Export auction history to a csv file that you can import into Excel or other programs Clicking start export will deduct a one time CoflCoin
                    fee of 1500 to unlock the export of the item for you. This helps to keep the the amount of different items low and exports quicker. The file
                    will be sent to a discord webhook [input for webhook] Please check the filters you want to get data for [filters selected] Each export will
                    contain up to 1000 auctions matching your filter. You can choose to Add social information of the auction buyer, a check if the item is in
                    the players inventory and in which inventory (talisman,armor,backpack etc) and wherever or not to only return the last sale of each item.
                </p>
            </Modal.Body>
        </Modal>
    )
}

export default ExportArchivedData
