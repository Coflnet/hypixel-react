'use client'
import { Alert } from 'react-bootstrap'

interface Props {
    onFinish()
}

function TransferCoflCoins(_: Props) {
    return (
        <Alert variant="warning" className="mb-0">
            CoflCoin transfers are temporarily disabled while the process is being reworked. We expect a replacement to be available again in mid-August.
        </Alert>
    )
}

export default TransferCoflCoins
