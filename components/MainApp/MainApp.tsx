import React, { useEffect, useState } from 'react'
import { useMatomo } from '@datapunt/matomo-tracker-react'
import CookieConsent from 'react-cookie-consent'
import { ToastContainer } from 'react-toastify'
import { OfflineBanner } from '../OfflineBanner/OfflineBanner'
import registerNotificationCallback from '../../utils/NotificationUtils'
import { getURLSearchParam } from '../../utils/Parser/URLParser'
import Cookies from 'js-cookie'
import { Modal } from 'react-bootstrap'
import ReloadDialog from '../ReloadDialog/ReloadDialog'
import { startMigrations } from '../../migrations/MigrationUtils'
import { useRouter } from 'next/router'
import { v4 as generateUUID } from 'uuid'
import { isClientSideRendering } from '../../utils/SSRUtils'

export function MainApp(props: any) {
    const [showRefreshFeedbackDialog, setShowRefreshFeedbackDialog] = useState(false)
    const [isReloadTracked, setIsReloadTracked] = useState(false)
    const { trackPageView, trackEvent, pushInstruction } = useMatomo()
    const router = useRouter()

    useEffect(() => {
        window.sessionStorage.setItem('sessionId', generateUUID())
        checkForReload()
        startMigrations()
    }, [])

    useEffect(() => {
        pushInstruction('requireConsent')

        // check for tracking of old users
        let cookie = Cookies.get('nonEssentialCookiesAllowed')
        if (cookie === 'true') {
            pushInstruction('rememberConsentGiven')
        }

        let refId = getURLSearchParam('refId')
        if (refId) {
            ;(window as any).refId = refId
        }

        registerNotificationCallback(router)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isClientSideRendering() ? location : null])

    useEffect(() => {
        trackPageView({})
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isClientSideRendering() ? document.title : null])

    function checkForReload() {
        let preventReloadDialog = localStorage.getItem('rememberHideReloadDialog') === 'true'
        if (preventReloadDialog || isReloadTracked) {
            return
        }

        // check if page was reloaded
        if (
            window.performance
                .getEntriesByType('navigation')
                .map(nav => (nav as PerformanceNavigationTiming).type)
                .includes('reload')
        ) {
            let lastReloadTime = localStorage.getItem('lastReloadTime')
            // Check if the last reload was less than 30 seconds ago
            if (lastReloadTime && 30_000 > new Date().getTime() - Number(lastReloadTime)) {
                setTimeout(() => {
                    setShowRefreshFeedbackDialog(true)
                }, 1000)
            } else {
                setIsReloadTracked(true)
                localStorage.setItem('lastReloadTime', new Date().getTime().toString())
            }
        }
    }

    function setTrackingAllowed() {
        pushInstruction('rememberConsentGiven')
        trackPageView({})
    }

    let refreshFeedbackDialog = (
        <Modal
            size={'lg'}
            show={showRefreshFeedbackDialog}
            onHide={() => {
                setShowRefreshFeedbackDialog(false)
            }}
        >
            <Modal.Header closeButton>
                <Modal.Title>Has an error occured?</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <ReloadDialog
                    onClose={() => {
                        setShowRefreshFeedbackDialog(false)
                    }}
                />
            </Modal.Body>
        </Modal>
    )

    return (
        <div>
            <OfflineBanner />
            {props.children}
            <CookieConsent
                enableDeclineButton
                declineButtonStyle={{ backgroundColor: 'rgb(65, 65, 65)', borderRadius: '10px', color: 'lightgrey', fontSize: '14px' }}
                buttonStyle={{ backgroundColor: 'green', borderRadius: '10px', color: 'white', fontSize: '20px' }}
                contentStyle={{ marginBottom: '0px' }}
                buttonText="Yes, I Understand"
                declineButtonText="Decline"
                cookieName="nonEssentialCookiesAllowed"
                data-nosnippet
                style={{ paddingLeft: '2vw' }}
                onAccept={() => {
                    setTrackingAllowed()
                }}
            >
                <span data-nosnippet>
                    <p style={{ margin: '0' }}>
                        We use cookies for analytics. By clicking the "Yes, I Understand" button, you consent our use of cookies. View our <a href="https://coflnet.com/privacy" style={{backgroundColor: 'white', textDecoration: 'none', color: 'black', borderRadius:'3px'}}>Privacy Policy ↗️</a>
                    </p>
                </span>
            </CookieConsent>
            {refreshFeedbackDialog}
            <ToastContainer theme={'colored'} />
        </div>
    )
}
