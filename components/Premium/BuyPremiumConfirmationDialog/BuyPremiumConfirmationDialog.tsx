'use client'
import { Button, Modal } from 'react-bootstrap'
import styles from './BuyPremiumConfirmationDialog.module.css'
import { getPremiumType } from '../../../utils/PremiumTypeUtils'
import { useState, useEffect, type JSX } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import { toast } from 'react-toastify'
import { usePurchaseDeclaration } from '../../../hooks/usePurchaseDeclaration'
import PurchaseDeclaration from '../PurchaseDeclaration/PurchaseDeclaration'

interface Props {
    type: 'prepaid' | 'subscription'
    show: boolean
    purchasePremiumType: PremiumType
    purchasePremiumOption: PremiumTypeOption
    durationString?: JSX.Element | string
    purchasePrice: JSX.Element | string
    activePremiumProduct?: PremiumProduct
    slotCount?: number
    onHide()
    onConfirm(googleToken: string, declaration?: ServicePurchaseDeclaration)
}

export default function BuyPremiumConfirmationDialog(props: Props) {
    // skip the extra login confirmation for subscription purchases
    const [hasConfirmedLogin, setHasConfirmedLogin] = useState(props.type === 'subscription')
    useEffect(() => {
        setHasConfirmedLogin(props.type === 'subscription')
    }, [props.type])
    const [googleToken, setGoogleToken] = useState('')
    const isPrepaid = props.type === 'prepaid'
    // every opened dialog is a new order: the declaration starts unticked
    const declaration = usePurchaseDeclaration(props.show && isPrepaid, props.show ? props.purchasePremiumOption.productId : '')
    const locale = declaration.locale

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
                {isPrepaid && (
                    <>
                        <p>
                            {props.slotCount ? (locale === 'de'
                                ? 'Deine Slots beginnen nach dem Kauf. Weise sie danach in deinem Konto deinen Freunden zu.'
                                : 'Your slots start after purchase. Assign them from your account to your friends.') : locale === 'de'
                                ? 'Premium-Zeit wird zum nächstmöglichen Zeitpunkt hinzugefügt und kann normalerweise nicht auf ein anderes Konto verschoben werden.'
                                : 'Premium time is added at the next available start and cannot ordinarily be moved to another account.'}
                        </p>
                        <PurchaseDeclaration state={declaration} id="premium-early-start-declaration" />
                    </>
                )}
                {props.type === 'subscription' && <p>This subscription will be automatically renewed. It can be canceled at any time and will then run out.</p>}
                {!props.slotCount && props.activePremiumProduct && getPremiumType(props.activePremiumProduct)?.productId !== props.purchasePremiumType.productId ? (
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
                <Button
                    variant="success"
                    style={{ float: 'right' }}
                    disabled={!hasConfirmedLogin || (isPrepaid && !declaration.confirmed)}
                    onClick={() => props.onConfirm(googleToken, isPrepaid ? declaration.declaration : undefined)}
                >
                    Buy now for {props.purchasePrice}
                </Button>
            </Modal.Body>
        </Modal>
    )
}
