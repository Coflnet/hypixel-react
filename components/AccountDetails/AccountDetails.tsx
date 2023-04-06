import { useMatomo } from '@jonkoops/matomo-tracker-react'
import { googleLogout } from '@react-oauth/google'
import Cookies from 'js-cookie'
import Image from 'next/image'
import { ChangeEvent, useEffect, useState } from 'react'
import { Button, Form, Modal } from 'react-bootstrap'
import { toast } from 'react-toastify'
import api from '../../api/ApiHelper'
import { atobUnicode } from '../../utils/Base64Utils'
import cacheUtils from '../../utils/CacheUtils'
import { useCoflCoins } from '../../utils/Hooks'
import { getLoadingElement } from '../../utils/LoadingUtils'
import { getHighestPriorityPremiumProduct } from '../../utils/PremiumTypeUtils'
import { CopyButton } from '../CopyButton/CopyButton'
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn'
import NavBar from '../NavBar/NavBar'
import { Number } from '../Number/Number'
import PremiumStatus from '../Premium/PremiumStatus/PremiumStatus'
import Tooltip from '../Tooltip/Tooltip'
import TransferCoflCoins from '../TransferCoflCoins/TransferCoflCoins'
import styles from './AccountDetails.module.css'
import PrivacySettings from './PrivacySettings/PrivacySettings'

function AccountDetails() {
    let [isLoggedIn, setIsLoggedIn] = useState(false)
    let [hasWrongFormattedGoogleToken, setHasWrongFormattedGoogleToken] = useState(false)
    let [isLoading, setIsLoading] = useState(true)
    let [rerenderGoogleSignIn, setRerenderGoogleSignIn] = useState(false)
    let [hasPremium, setHasPremium] = useState(false)
    let [hasPremiumUntil, setHasPremiumUntil] = useState<Date | undefined>()
    let [products, setProducts] = useState<PremiumProduct[]>([])
    let [showSendcoflcoins, setShowSendCoflcoins] = useState(false)
    let coflCoins = useCoflCoins()
    let { pushInstruction } = useMatomo()

    useEffect(() => {
        if (sessionStorage.getItem('googleId') === null) {
            setIsLoading(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    function getAccountElement(): JSX.Element {
        let googleId = sessionStorage.getItem('googleId')
        if (googleId) {
            try {
                let parts = googleId.split('.')
                let obj = JSON.parse(atobUnicode(parts[1]))
                let imageElement = obj.picture ? <Image src={obj.picture} height={24} width={24} alt="" /> : <span />
                return (
                    <span>
                        {imageElement} {`${obj.name} (${obj.email})`}
                    </span>
                )
            } catch {
                setHasWrongFormattedGoogleToken(true)
            }
        }
        return <span />
    }

    function loadPremiumProducts(): Promise<void> {
        return api.refreshLoadPremiumProducts(products => {
            products = products.filter(product => product.expires.getTime() > new Date().getTime())
            setProducts(products)
            let activeProduct = getHighestPriorityPremiumProduct(products)

            if (!activeProduct) {
                setHasPremium(false)
            } else {
                setHasPremium(true)
                setHasPremiumUntil(activeProduct.expires)
            }
            setIsLoading(false)
        })
    }

    function onLogout() {
        setIsLoggedIn(false)
        setIsLoading(false)
        googleLogout()
        sessionStorage.removeItem('googleId')
        setRerenderGoogleSignIn(!rerenderGoogleSignIn)
        toast.warn('Successfully logged out')
    }

    function onLogin() {
        let googleId = sessionStorage.getItem('googleId')
        setIsLoading(true)
        if (googleId) {
            loadPremiumProducts()
            setIsLoggedIn(true)
        }
    }

    function onLoginFail() {
        setIsLoggedIn(false)
        setRerenderGoogleSignIn(!rerenderGoogleSignIn)
    }

    function deleteCaches() {
        cacheUtils.clearAll()
        document.cookie = ''
        localStorage.clear()
        sessionStorage.clear()
        window.location.reload()
    }

    function setTrackingAllowed(event: ChangeEvent<HTMLInputElement>) {
        let val = event.target.checked
        if (val) {
            pushInstruction('rememberConsentGiven')
            Cookies.set('nonEssentialCookiesAllowed', 'true')
        } else {
            pushInstruction('forgetConsentGiven')
            Cookies.set('nonEssentialCookiesAllowed', false)
        }
    }

    function isTrackingAllowed() {
        let cookie = Cookies.get('nonEssentialCookiesAllowed')
        return cookie === 'true'
    }

    function deleteGoogleToken() {
        sessionStorage.removeItem('googleId')
        setIsLoggedIn(false)
        setRerenderGoogleSignIn(!rerenderGoogleSignIn)
    }

    return (
        <>
            <h2 style={{ marginBottom: '30px' }}>
                <NavBar />
                Account details
            </h2>
            {!isLoading && isLoggedIn ? (
                <div>
                    {!hasWrongFormattedGoogleToken ? (
                        <p>
                            <span className={styles.label}>Account:</span> {getAccountElement()}
                        </p>
                    ) : (
                        <div>
                            <hr />
                            <p>
                                Some problem occured while processing your Google login. Everything should still work as expected, but we cant display certain
                                information like your username or profile picture.
                            </p>
                            <p style={{ color: 'red', fontWeight: 'bold' }}>
                                IMPORTANT: Do not give out the following information to a untrusted third party. This token could be used to access your google
                                account!
                            </p>
                            <p>
                                Your Goolge token:{' '}
                                <CopyButton
                                    copyValue={sessionStorage.getItem('googleId')}
                                    successMessage={
                                        <div>
                                            Copied your Google token.
                                            <br />
                                            <b>Be careful who you trust with this!</b>
                                        </div>
                                    }
                                />
                            </p>
                        </div>
                    )}
                    <PremiumStatus products={products} labelStyle={{ width: '300px', fontWeight: 'bold' }} />
                    <p>
                        <span className={styles.label}>CoflCoins:</span> <Number number={coflCoins} />
                        <Button
                            className={styles.sendCoflCoinsButton}
                            onClick={() => {
                                setShowSendCoflcoins(true)
                            }}
                        >
                            Send CoflCoins
                        </Button>
                        <Modal
                            size={'lg'}
                            show={showSendcoflcoins}
                            onHide={() => {
                                setShowSendCoflcoins(false)
                            }}
                        >
                            <Modal.Header closeButton>
                                <Modal.Title>Send CoflCoins</Modal.Title>
                            </Modal.Header>
                            <Modal.Body>
                                <TransferCoflCoins
                                    onFinish={() => {
                                        setShowSendCoflcoins(false)
                                    }}
                                />
                            </Modal.Body>
                        </Modal>
                    </p>
                </div>
            ) : null}
            {isLoading ? getLoadingElement() : null}
            <GoogleSignIn onAfterLogin={onLogin} onLoginFail={onLoginFail} rerenderFlip={rerenderGoogleSignIn} />
            {isLoggedIn ? (
                <div style={{ marginTop: '20px' }}>
                    <Button onClick={onLogout}>Logout</Button>
                </div>
            ) : null}
            <hr />
            <h2 style={{ marginBottom: '30px' }}>Settings</h2>
            <div style={{ paddingBottom: '1rem' }}>
                <div>
                    <span className={styles.label}>Allow cookies for analytics: </span>
                    <Form.Check onChange={setTrackingAllowed} defaultChecked={isTrackingAllowed()} type="checkbox" />
                </div>
            </div>
            <div style={{ paddingBottom: '1rem' }}>
                <span className={styles.label}>Login problems?</span>
                <div>
                    <Tooltip
                        type="hover"
                        content={
                            <Button variant="danger" onClick={deleteGoogleToken}>
                                Reset Google login
                            </Button>
                        }
                        tooltipContent={<span>Make sure your browser doesn't block popups. Otherwise use this button to reset your Google login</span>}
                    />
                </div>
            </div>
            {isLoggedIn ? (
                <div style={{ paddingBottom: '1rem' }}>
                    <div style={{ display: 'inline-block' }}>
                        <span className={styles.label}>Mod data settings: </span>
                        <Tooltip
                            type="click"
                            content={<span className={styles.link}>Open settings</span>}
                            tooltipContent={<PrivacySettings />}
                            tooltipTitle={<span>Mod data settings</span>}
                        />
                    </div>
                </div>
            ) : null}
            <div style={{ paddingBottom: '1rem' }}>
                <span className={styles.label}>Delete Caches/Cookies and hard refresh:</span>
                <Tooltip
                    type="click"
                    content={<span className={styles.link}>Delete</span>}
                    tooltipContent={
                        <div>
                            <p>Warning: Deleting your Caches/Cookies will delete all your settings and log you out.</p>
                            <Button variant="danger" onClick={deleteCaches}>
                                Confirm deletion
                            </Button>
                        </div>
                    }
                    tooltipTitle={<span>Are you sure?</span>}
                />
            </div>
        </>
    )
}

export default AccountDetails
