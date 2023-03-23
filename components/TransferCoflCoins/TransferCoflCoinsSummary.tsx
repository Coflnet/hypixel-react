import { useState } from 'react'
import { Button } from 'react-bootstrap'
import { toast } from 'react-toastify'
import { v4 as generateUUID } from 'uuid'
import api from '../../api/ApiHelper'
import { numberWithThousandsSeparators } from '../../utils/Formatter'
import { getLoadingElement } from '../../utils/LoadingUtils'
import styles from './TransferCoflCoinsSummary.module.css'

interface Props {
    receiverType: 'email' | 'mcId'
    email?: string
    player?: Player
    coflCoins: number
    onBack()
    onFinish()
}

function TransferCoflCoinsSummary(props: Props) {
    let [reference] = useState(generateUUID())
    let [isSending, setIsSending] = useState(false)

    function onSend() {
        setIsSending(true)
        api.transferCoflCoins(props.email, props.player?.uuid, props.coflCoins, reference)
            .then(() => {
                toast.success(
                    `Successfuly sent ${numberWithThousandsSeparators(props.coflCoins)} CoflCoins to ${props.email === '' ? props.player.name : props.email}`
                )
                setIsSending(false)
                props.onFinish()
            })
            .catch(() => {
                setIsSending(false)
                props.onFinish()
            })
    }

    return (
        <>
            {!isSending ? (
                <div>
                    <p>
                        <span className={styles.label}>Receiver:</span>
                        {props.receiverType === 'email' ? (
                            <span>{props.email}</span>
                        ) : (
                            <span>
                                <img
                                    crossOrigin="anonymous"
                                    className="playerHeadIcon"
                                    src={props.player?.iconUrl}
                                    height="32"
                                    alt=""
                                    style={{ marginRight: '10px' }}
                                    loading="lazy"
                                />
                                {props.player.name}
                            </span>
                        )}
                    </p>
                    <p>
                        <span className={styles.label}>Amount: </span>
                        {props.coflCoins} CoflCoins
                    </p>

                    <hr />
                    <p>
                        <span style={{ color: 'red' }}>Warning: </span>
                        <br />
                        Please make sure this is really the person you want to send CoflCoins to. You may not be able to get them back!
                    </p>

                    <Button className={styles.returnButton} onClick={props.onBack}>
                        Back
                    </Button>
                    <Button variant="success" className={styles.sendButton} onClick={onSend}>
                        Send
                    </Button>
                </div>
            ) : (
                getLoadingElement(<p>Sending CoflCoins</p>)
            )}
        </>
    )
}

export default TransferCoflCoinsSummary
