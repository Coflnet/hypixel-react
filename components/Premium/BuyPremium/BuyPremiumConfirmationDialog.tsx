'use client'
import { Button, Modal } from 'react-bootstrap'
import styles from './BuyPremium.module.css'
import Number from '../../Number/Number'
import { getPremiumType } from '../../../utils/PremiumTypeUtils'
import { useState } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import { toast } from 'react-toastify'

interface Props {
    show: boolean
    purchasePremiumType: PremiumType
    purchasePremiumOption: PremiumTypeOption
    durationString: string
    purchasePrice: number
    activePremiumProduct: PremiumProduct
    onHide()
    onConfirm(googleToken: string)
}

export default function BuyPremiumConfirmationDialog(props: Props) {
    let [hasConfirmedLogin, setHasConfirmedLogin] = useState(false)
    let [googleToken, setGoogleToken] = useState('')

    return (
        <Modal
            show={props.show}
            onHide={() => {
                props.onHide()
            }}
        >
            <Modal.Header closeButton>
                <Modal.Title>Confirmation</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <ul>
                    <li>
                        <span className={styles.label}>Type:</span>
                        {props.purchasePremiumType.label}
                    </li>
                    <li>
                        <span className={styles.label}>Duration:</span>
                        {props.purchasePremiumOption.label} {props.durationString}
                    </li>
                    <li>
                        <span className={styles.label}>Price:</span>
                        <Number number={props.purchasePrice} /> CoflCoins
                    </li>
                </ul>
                <p>The time will be added to account. After you confirmed the purchase, it can't be canceled/moved to another account</p>
                {props.activePremiumProduct && getPremiumType(props.activePremiumProduct)?.productId !== props.purchasePremiumType.productId ? (
                    <div>
                        <hr />
                        <p style={{ color: 'yellow' }}>
                            It seems you already have an active premium product. While the 'better' premium is active, the other will get paused.
                        </p>
                    </div>
                ) : null}
                <hr />
                {!hasConfirmedLogin ? (
                    <>
                        <p>Please login again to confirm your Identity:</p>
                        <div style={{ width: '250px', colorScheme: 'light', marginBottom: '15px' }}>
                            <GoogleLogin
                                onSuccess={response => {
                                    setHasConfirmedLogin(true)
                                    setGoogleToken(response.credential!)
                                }}
                                onError={() => {
                                    toast.error('Login failed')
                                }}
                                theme={'filled_blue'}
                                size={'large'}
                            />
                        </div>
                    </>
                ) : null}
                <Button variant="danger" onClick={props.onHide}>
                    Cancel
                </Button>
                <Button variant="success" style={{ float: 'right' }} disabled={!hasConfirmedLogin} onClick={() => props.onConfirm(googleToken)}>
                    Confirm
                </Button>
            </Modal.Body>
        </Modal>
    )
}
