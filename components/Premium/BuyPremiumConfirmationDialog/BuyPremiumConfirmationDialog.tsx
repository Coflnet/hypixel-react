'use client'
import { Button, Modal } from 'react-bootstrap'
import styles from './BuyPremiumConfirmationDialog.module.css'
import { getPremiumType } from '../../../utils/PremiumTypeUtils'
import { useState, useEffect, type JSX } from 'react';
import { GoogleLogin } from '@react-oauth/google'
import { toast } from 'react-toastify'
import { duration } from 'moment'

interface Props {
    type: 'prepaid' | 'subscription'
    show: boolean
    purchasePremiumType: PremiumType
    purchasePremiumOption: PremiumTypeOption
    durationString?: JSX.Element | string
    purchasePrice: JSX.Element | string
    activePremiumProduct: PremiumProduct
    onHide()
    onConfirm(googleToken: string)
}

export default function BuyPremiumConfirmationDialog(props: Props) {
    // skip the extra login confirmation for subscription purchases
    let [hasConfirmedLogin, setHasConfirmedLogin] = useState(props.type === 'subscription')
    useEffect(() => {
        setHasConfirmedLogin(props.type === 'subscription')
    }, [props.type])
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
                    {props.durationString && (
                        <li>
                            <span className={styles.label}>Duration:</span>
                            {props.purchasePremiumOption.label} {props.durationString}
                        </li>
                    )}
                    <li>
                        <span className={styles.label}>Price:</span>
                        {props.purchasePrice}
                    </li>
                </ul>
                {props.type === 'prepaid' && (
                    <p>The time will be added to account. After you confirmed the purchase, it can't be canceled/moved to another account</p>
                )}
                {props.type === 'subscription' && (
                    <p>This subscription will be automatically renewed. It can be canceled at any time and will then run out.</p>
                )}
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
