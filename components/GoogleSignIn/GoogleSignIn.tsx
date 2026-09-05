'use client'
import React, { useEffect, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import api from '../../api/ApiHelper'
import { useMatomo } from '@jonkoops/matomo-tracker-react'
import { useForceUpdate } from '../../utils/Hooks'
import { isClientSideRendering } from '../../utils/SSRUtils'
import { CUSTOM_EVENTS } from '../../api/ApiTypes.d'
import { GoogleLogin } from '@react-oauth/google'
import styles from './GoogleSignIn.module.css'
import { GOOGLE_EMAIL, GOOGLE_NAME, GOOGLE_PROFILE_PICTURE_URL, setSetting } from '../../utils/SettingsUtils'
import { atobUnicode } from '../../utils/Base64Utils'
import { Button, Modal } from 'react-bootstrap'
import AgreementDocumentList from '../Legal/AgreementDocumentList'
import { isTermsReminderPostponed, postponeTermsReminder } from '../../utils/TermsReminderUtils'

interface Props {
    onAfterLogin?(): void
    onLoginFail?(): void
    onManualLoginClick?(): void
    rerenderFlip?: number
}

function GoogleSignIn(props: Props) {
    let [wasAlreadyLoggedInThisSession, setWasAlreadyLoggedInThisSession] = useState(
        isClientSideRendering() ? isValidTokenAvailable(localStorage.getItem('googleId')) : false
    )

    let [isLoggedIn, setIsLoggedIn] = useState(false)
    let [isSSR, setIsSSR] = useState(true)
    let [showSignInModal, setShowSignInModal] = useState(false)
    let [showTermsModal, setShowTermsModal] = useState(false)
    let [termsStatus, setTermsStatus] = useState<TermsStatus>()
    let [termsLoading, setTermsLoading] = useState(false)
    let [pendingLoginToken, setPendingLoginToken] = useState<string>()
    let completedLogin = useRef(false)
    const legalLocale = typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('de') ? 'de' : 'en'
    let { trackEvent } = useMatomo()
    let forceUpdate = useForceUpdate()

    useEffect(() => {
        setIsSSR(false)
        if (wasAlreadyLoggedInThisSession) {
            let token = localStorage.getItem('googleId')!
            let userObject = JSON.parse(atobUnicode(token.split('.')[1]))
            setSetting(GOOGLE_EMAIL, userObject.email)
            onLoginSucces(token, false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (wasAlreadyLoggedInThisSession) {
            setIsLoggedIn(true)
        }
    }, [wasAlreadyLoggedInThisSession])

    useEffect(() => {
        forceUpdate()
        setIsLoggedIn(sessionStorage.getItem('googleId') !== null)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.rerenderFlip])

    function completeLogin() {
        if (completedLogin.current) return
        completedLogin.current = true
        setShowTermsModal(false)
        document.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.GOOGLE_LOGIN))
        props.onAfterLogin?.()
    }

    async function finishLogin(loginToken: string) {
        setTermsLoading(true)
        try {
            const token = await api.loginWithToken(loginToken)
            localStorage.setItem('googleId', token)
            sessionStorage.setItem('googleId', token)
            let refId = (window as any).refId
            if (refId) api.setRef(refId, 'new-user-100-v1', document.documentElement.lang || navigator.language || 'en')
            completeLogin()
        } catch (error: any) {
            if (error?.slug === 'terms_acceptance_required') {
                setTermsStatus(status => (status ? { ...status, canContinueWithoutAccepting: false } : status))
                setShowTermsModal(true)
                return
            }
            if (error?.slug !== 'invalid_token')
                toast.error(`An error occoured while trying to sign in with Google. ${error ? error.slug || JSON.stringify(error) : null}`)
            else console.warn('setGoogle: Invalid token error', error)
            setIsLoggedIn(false)
            setWasAlreadyLoggedInThisSession(false)
            sessionStorage.removeItem('googleId')
            localStorage.removeItem('googleId')
        } finally {
            setTermsLoading(false)
        }
    }

    async function requestTermsAcceptance(loginToken: string, forceRefresh: boolean) {
        setPendingLoginToken(loginToken)
        setTermsLoading(true)
        try {
            const status = await api.getTermsStatus(legalLocale, loginToken, forceRefresh)
            setTermsStatus(status)
            if (status.required && !(status.canContinueWithoutAccepting && isTermsReminderPostponed(status.agreementHash, loginToken))) setShowTermsModal(true)
            else await finishLogin(loginToken)
        } catch {
            toast.error(
                legalLocale === 'de'
                    ? 'Die aktuellen Vertragsbedingungen konnten nicht geprüft werden. Bitte versuchen Sie es erneut.'
                    : 'The current agreement could not be checked. Please try again.'
            )
            setIsLoggedIn(false)
            setWasAlreadyLoggedInThisSession(false)
            sessionStorage.removeItem('googleId')
            localStorage.removeItem('googleId')
        } finally {
            setTermsLoading(false)
        }
    }

    async function acceptTerms() {
        if (!termsStatus || !pendingLoginToken) return
        setTermsLoading(true)
        try {
            const status = await api.acceptTerms(termsStatus.version, termsStatus.agreementHash, `web-login-${legalLocale}`, legalLocale, pendingLoginToken)
            setTermsStatus(status)
            if (status.required) {
                toast.error(legalLocale === 'de' ? 'Der Vertrag hat sich geändert. Bitte erneut prüfen.' : 'The agreement changed. Please review it again.')
                return
            }
            await finishLogin(pendingLoginToken)
        } catch {
            toast.error(legalLocale === 'de' ? 'Die Annahme konnte nicht gespeichert werden.' : 'The acceptance could not be saved.')
            if (termsStatus.canContinueWithoutAccepting) {
                postponeTermsReminder(termsStatus.agreementHash, pendingLoginToken)
                await finishLogin(pendingLoginToken)
            }
        } finally {
            setTermsLoading(false)
        }
    }

    function onLoginSucces(token: string, forceRefresh = true) {
        setShowSignInModal(false)
        setIsLoggedIn(true)
        void requestTermsAcceptance(token, forceRefresh)
    }

    function continueUnderPreviousTerms() {
        if (!termsStatus || !pendingLoginToken) return
        postponeTermsReminder(termsStatus.agreementHash, pendingLoginToken)
        void finishLogin(pendingLoginToken)
    }

    function onLoginFail() {
        toast.error('Something went wrong, please try again.', { autoClose: 20000 })
    }

    function onLoginClick() {
        setShowSignInModal(true)
        if (props.onManualLoginClick) {
            props.onManualLoginClick()
        }
        trackEvent({
            category: 'login',
            action: 'click'
        })
    }

    if (isSSR) {
        return null
    }

    return (
        <>
            {!isLoggedIn && !wasAlreadyLoggedInThisSession ? (
                <Button className="px-4 py-2" onClick={onLoginClick} aria-haspopup="dialog">
                    Sign in
                </Button>
            ) : null}
            <Modal show={showSignInModal} onHide={() => setShowSignInModal(false)} centered contentClassName={styles.agreementModal}>
                <Modal.Header closeButton>
                    <Modal.Title>Sign in to SkyCofl</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className={styles.googleButton}>
                        <GoogleLogin
                            onSuccess={response => {
                                try {
                                    let userObject = JSON.parse(atobUnicode(response.credential!.split('.')[1]))
                                    setSetting(GOOGLE_PROFILE_PICTURE_URL, userObject.picture)
                                    setSetting(GOOGLE_EMAIL, userObject.email)
                                    setSetting(GOOGLE_NAME, userObject.name)
                                } catch {
                                    toast.warn('Parsing issue with the google token. There might be issues when displaying details on the account page!')
                                }
                                onLoginSucces(response.credential!)
                            }}
                            onError={onLoginFail}
                            theme="filled_blue"
                            size="large"
                            shape="pill"
                        />
                    </div>
                    <p className={styles.signInNotice}>
                        Read our{' '}
                        <a href="https://coflnet.com/privacy" target="_blank" rel="noreferrer">
                            Privacy Policy
                        </a>{' '}
                        and{' '}
                        <a href="https://coflnet.com/terms-of-service" target="_blank" rel="noreferrer">
                            Terms of Service
                        </a>
                        . We’ll ask you to accept the current terms after signing in, if needed.
                    </p>
                    <details className={styles.signInHelp}>
                        <summary>Google button not showing?</summary>
                        <p>Your browser, an extension or antivirus software may be blocking Google sign-in. Check your blocking settings and try again.</p>
                    </details>
                </Modal.Body>
            </Modal>
            {termsLoading && !showTermsModal ? (
                <span className={styles.progress} role="status">
                    {legalLocale === 'de' ? 'Anmeldung wird abgeschlossen…' : 'Finishing sign-in…'}
                </span>
            ) : null}
            <Modal show={showTermsModal} backdrop="static" keyboard={false} centered contentClassName={styles.agreementModal}>
                <Modal.Header>
                    <div>
                        <span className={styles.eyebrow}>{legalLocale === 'de' ? 'BEDINGUNGEN & DATENSCHUTZ' : 'TERMS & PRIVACY'}</span>
                        <Modal.Title>{legalLocale === 'de' ? 'SkyCofl-Vertrag prüfen' : 'Review the SkyCofl agreement'}</Modal.Title>
                    </div>
                </Modal.Header>
                <Modal.Body>
                    <p>
                        {termsStatus?.canContinueWithoutAccepting === false
                            ? legalLocale === 'de'
                                ? 'Bitte prüfen Sie das vollständige Vertragspaket. Die Annahme ist erforderlich, um die Registrierung abzuschließen.'
                                : 'Please review the complete agreement package. Acceptance is required to finish creating your account.'
                            : legalLocale === 'de'
                              ? 'Bitte prüfen Sie das vollständige Vertragspaket. Sie können unter den zuvor angenommenen Bedingungen fortfahren; neue Käufe erfordern die aktuelle Annahme.'
                              : 'Please review the complete agreement package. You may continue under previously accepted terms; new purchases require current acceptance.'}
                    </p>
                    {termsStatus ? <AgreementDocumentList documents={termsStatus.documents} locale={legalLocale} /> : null}
                    <p className={styles.legalNotice}>
                        {legalLocale === 'de'
                            ? 'Mit „Vertragspaket annehmen“ stimmen Sie den oben aufgeführten Bedingungen zu. Informationen zur Verarbeitung Ihrer Daten finden Sie in unserer '
                            : 'Selecting “Accept agreement package” confirms your acceptance of the terms listed above. Learn how we handle your data in our '}
                        <a href="https://coflnet.com/privacy" target="_blank" rel="noreferrer">
                            {legalLocale === 'de' ? 'Datenschutzerklärung' : 'Privacy Policy'}
                        </a>
                        .
                    </p>
                    {termsStatus ? (
                        <a className={styles.agreementDetails} href={termsStatus.agreementUrl} target="_blank" rel="noreferrer">
                            {legalLocale === 'de' ? 'Details zur Vertragsversion' : 'Agreement version details'}
                        </a>
                    ) : null}
                </Modal.Body>
                <Modal.Footer className={styles.agreementActions}>
                    {termsStatus?.canContinueWithoutAccepting !== false && pendingLoginToken ? (
                        <Button variant="secondary" disabled={termsLoading} onClick={continueUnderPreviousTerms}>
                            {legalLocale === 'de' ? 'Unter bisherigen Bedingungen fortfahren' : 'Continue under previous terms'}
                        </Button>
                    ) : null}
                    <Button variant="primary" disabled={termsLoading || !termsStatus || !pendingLoginToken} onClick={() => void acceptTerms()}>
                        {legalLocale === 'de' ? 'Vertragspaket annehmen' : 'Accept agreement package'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    )
}

export default GoogleSignIn

export function isValidTokenAvailable(token?: string | null) {
    if (!token || token === 'null') {
        return
    }
    try {
        let details = JSON.parse(atobUnicode(token.split('.')[1]))
        let expirationDate = new Date(parseInt(details.exp) * 1000)
        return expirationDate.getTime() - 10000 > new Date().getTime()
    } catch (e) {
        toast.warn("Parsing issue with the google token. Can't automatically login!")
        return false
    }
}
