'use client'
import { Alert, Button, Form, Modal } from 'react-bootstrap'
import styles from './BuyPremiumConfirmationDialog.module.css'
import { getPremiumType } from '../../../utils/PremiumTypeUtils'
import { useState, useEffect, type JSX } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import { toast } from 'react-toastify'
import api from '../../../api/ApiHelper'

interface Props {
    type: 'prepaid' | 'subscription'
    show: boolean
    purchasePremiumType: PremiumType
    purchasePremiumOption: PremiumTypeOption
    durationString?: JSX.Element | string
    purchasePrice: JSX.Element | string
    activePremiumProduct: PremiumProduct
    onHide()
    onConfirm(googleToken: string, declaration?: ServicePurchaseDeclaration)
}

export default function BuyPremiumConfirmationDialog(props: Props) {
    // skip the extra login confirmation for subscription purchases
    let [hasConfirmedLogin, setHasConfirmedLogin] = useState(props.type === 'subscription')
    useEffect(() => {
        setHasConfirmedLogin(props.type === 'subscription')
    }, [props.type])
    let [googleToken, setGoogleToken] = useState('')
    const locale = typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('de') ? 'de' : 'en'
    const [declaration, setDeclaration] = useState<ServicePurchaseDeclaration>()
    const [declarationAccepted, setDeclarationAccepted] = useState(false)
    const [declarationError, setDeclarationError] = useState(false)

    useEffect(() => {
        if (!props.show || props.type !== 'prepaid') return
        setDeclaration(undefined)
        setDeclarationAccepted(false)
        setDeclarationError(false)
        api.getTermsStatus(locale)
            .then(status => {
                if (!status.canStartNewContract || !status.premiumPurchaseDeclaration) throw new Error('Declaration unavailable')
                setDeclaration(status.premiumPurchaseDeclaration)
            })
            .catch(() => setDeclarationError(true))
    }, [props.show, props.type, locale])

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
                    <>
                        <p>
                            {locale === 'de'
                                ? 'Premium-Zeit wird zum nächstmöglichen Zeitpunkt hinzugefügt und kann normalerweise nicht auf ein anderes Konto verschoben werden.'
                                : 'Premium time is added at the next available start and cannot ordinarily be moved to another account.'}
                        </p>
                        {declarationError ? (
                            <Alert variant="danger">
                                {locale === 'de'
                                    ? 'Die aktuelle rechtliche Erklärung konnte nicht geladen werden. Der Kauf ist vorübergehend nicht möglich.'
                                    : 'The current legal declaration could not be loaded. Purchasing is temporarily unavailable.'}
                            </Alert>
                        ) : declaration ? (
                            <Form.Check
                                id="premium-early-start-declaration"
                                type="checkbox"
                                checked={declarationAccepted}
                                onChange={event => setDeclarationAccepted(event.target.checked)}
                                label={declaration.text}
                            />
                        ) : locale === 'de' ? (
                            'Erklärung wird geladen…'
                        ) : (
                            'Loading declaration…'
                        )}
                        <p>
                            <a
                                href={
                                    locale === 'de' ? 'https://coflnet.com/de/withdrawal#withdraw-contract' : 'https://coflnet.com/withdrawal#withdraw-contract'
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {locale === 'de' ? 'Widerrufsbelehrung und Online-Widerrufsformular' : 'Withdrawal instructions and online withdrawal form'}
                            </a>
                        </p>
                    </>
                )}
                {props.type === 'subscription' && <p>This subscription will be automatically renewed. It can be canceled at any time and will then run out.</p>}
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
                <Button
                    variant="success"
                    style={{ float: 'right' }}
                    disabled={!hasConfirmedLogin || (props.type === 'prepaid' && (!declaration || !declarationAccepted))}
                    onClick={() => props.onConfirm(googleToken, declaration)}
                >
                    Buy now for {props.purchasePrice}
                </Button>
            </Modal.Body>
        </Modal>
    )
}
