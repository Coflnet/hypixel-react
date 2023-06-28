'use client'
import { useEffect, useState } from 'react'
import { useMatomo } from '@jonkoops/matomo-tracker-react'
import CookieConsent from 'react-cookie-consent'
import { ToastContainer } from 'react-toastify'
import { OfflineBanner } from '../OfflineBanner/OfflineBanner'
import registerNotificationCallback from '../../utils/NotificationUtils'
import { getURLSearchParam } from '../../utils/Parser/URLParser'
import Cookies from 'js-cookie'
import { Modal } from 'react-bootstrap'
import ReloadDialog from '../ReloadDialog/ReloadDialog'
import { startMigrations } from '../../migrations/MigrationUtils'
import { v4 as generateUUID } from 'uuid'
import { isClientSideRendering } from '../../utils/SSRUtils'
import { useRouter } from 'next/navigation'
import NextTopLoader from 'nextjs-toploader'
import '../../styles/bootstrap-react.min.css'
import '../../styles/bootstrap-dark.min.css'
import '../../styles/globals.css'

interface ErrorLog {
    error: ErrorEvent
    timestamp: Date
}

export const errorLog: ErrorLog[] = []

export function MainApp(props: any) {
    const [showRefreshFeedbackDialog, setShowRefreshFeedbackDialog] = useState(false)
    const [isReloadTracked, setIsReloadTracked] = useState(false)
    const { trackPageView, trackEvent, pushInstruction } = useMatomo()
    const router = useRouter()

    useEffect(() => {
        window.addEventListener('error', function (event) {
            errorLog.push({
                error: event,
                timestamp: new Date()
            })

            if (event.error.name === 'ChunkLoadError') {
                let chunkErrorLocalStorage = window.localStorage.getItem('chunkErrorReload')
                if (chunkErrorLocalStorage && parseInt(chunkErrorLocalStorage) + 5000 > new Date().getTime()) {
                    alert('There is something wrong with the website-chunks. Please try Control + F5 to hard refresh the page.')
                    return
                }
                window.localStorage.setItem('chunkErrorReload', new Date().getTime().toString())
                caches
                    .keys()
                    .then(keys => {
                        keys.forEach(key => {
                            caches.delete(key)
                        })
                    })
                    .catch(() => {})
                location.reload()
            }
        })
    }, [])

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
        <>
            <OfflineBanner />
            <NextTopLoader />
            {props.children}
            <CookieConsent
                enableDeclineButton
                declineButtonStyle={{ backgroundColor: 'rgb(65, 65, 65)', borderRadius: '10px', color: 'lightgrey', fontSize: '14px' }}
                buttonStyle={{ backgroundColor: 'green', borderRadius: '10px', color: 'white', fontSize: '20px' }}
                contentStyle={{ marginBottom: '0px' }}
                buttonText="Yes, I understand"
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
                        We use cookies for analytics. By clicking the "Yes, I understand" button, you consent our use of cookies. View our{' '}
                        <a href="https://coflnet.com/privacy" style={{ backgroundColor: 'white', textDecoration: 'none', color: 'black', borderRadius: '3px' }}>
                            Privacy Policy ↗️
                        </a>
                    </p>
                </span>
            </CookieConsent>
            {refreshFeedbackDialog}
            <ToastContainer theme={'colored'} />
        </>
    )
}
