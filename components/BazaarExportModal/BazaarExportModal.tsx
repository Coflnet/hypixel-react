'use client'
import { useState } from 'react'
import { Alert, Button, Form, Modal } from 'react-bootstrap'
import api from '../../api/ApiHelper'
import { hasHighEnoughPremium, PREMIUM_RANK } from '../../utils/PremiumTypeUtils'
import { getGetApiBazaarItemTagExportUrl } from '../../api/_generated/skyApi'
import styles from './BazaarExportModal.module.css'
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn'

interface Props {
    show: boolean
    onHide: () => void
    itemTag: string
}

function BazaarExportModal(props: Props) {
    let [fullOrderBook, setFullOrderBook] = useState(false)
    let [startDate, setStartDate] = useState('')
    let [endDate, setEndDate] = useState('')
    let [hasPremium, setHasPremium] = useState(false)
    let [hasPremiumPlus, setHasPremiumPlus] = useState(false)
    let [isExporting, setIsExporting] = useState(false)

    let [isLoggedIn, setIsLoggedIn] = useState(false)
    let [hasLoadedPremium, setHasLoadedPremium] = useState(false)
    let [premiumLoadError, setPremiumLoadError] = useState(false)

    function loadPremiumProducts() {
        setPremiumLoadError(false)
        setHasLoadedPremium(false)

        api.refreshLoadPremiumProducts(
            products => {
                const hasPrem = hasHighEnoughPremium(products, PREMIUM_RANK.PREMIUM)
                const hasPremPlus = hasHighEnoughPremium(products, PREMIUM_RANK.PREMIUM_PLUS)
                setHasPremium(hasPrem)
                setHasPremiumPlus(hasPremPlus)
                setHasLoadedPremium(true)
            },
            () => {
                setPremiumLoadError(true)
                setHasPremium(false)
                setHasPremiumPlus(false)
                setHasLoadedPremium(true)
            }
        )
    }

    function onModalEntered() {
        let loggedIn = !!(typeof window !== 'undefined' && (sessionStorage.getItem('googleId') || localStorage.getItem('googleId')))
        setIsLoggedIn(loggedIn)

        if (!loggedIn) {
            setHasLoadedPremium(true)
            return
        }

        loadPremiumProducts()
    }

    function onLogin() {
        setIsLoggedIn(true)
        onModalEntered()
    }

    function handleModalHide() {
        props.onHide()
    }

    function getExportHistoryYears(): string {
        const dataStart = new Date(2019, 9, 1) // October 2019
        const now = new Date()
        const years = Math.floor((now.getTime() - dataStart.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        return `~${years} years`
    }

    function getMaxHistoryLabel(): string {
        if (hasPremiumPlus) return getExportHistoryYears()
        if (hasPremium) return '180 days'
        return 'None'
    }

    function getTierLabel(): string {
        if (hasPremiumPlus) return 'Premium+'
        if (hasPremium) return 'Premium'
        return 'Free'
    }

    function getTierVariant(): string {
        if (hasPremiumPlus) return 'warning'
        if (hasPremium) return 'success'
        return 'secondary'
    }

    function getTodayDate(): string {
        const today = new Date()
        return today.toISOString().split('T')[0]
    }

    function isDateRangeExceedsYear(): boolean {
        if (!startDate || !endDate) return false
        const start = new Date(startDate)
        const end = new Date(endDate)
        const diffTime = Math.abs(end.getTime() - start.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        // 400 days is just a nice approximate for "more than a year" to warn about slow exports
        return diffDays > 400
    }

    function isStartDateExceeds180Days(): boolean {
        if (!startDate) return false
        const start = new Date(startDate)
        const today = new Date()
        const diffTime = Math.abs(today.getTime() - start.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays > 180
    }

    function startExport() {
        if (!isLoggedIn || (!hasPremium && !hasPremiumPlus)) {
            // Need premium
            return
        }

        setIsExporting(true)

        const googleToken = sessionStorage.getItem('googleId') ?? localStorage.getItem('googleId') ?? ''

        // Using manual fetch instead of generated Tanstack query (e.g. useGetApiBazaarItemTagExport) 
        // because the generated API attempts to parse the response as JSON, but this endpoint returns a binary ZIP blob.
        const url = getGetApiBazaarItemTagExportUrl(props.itemTag, {
            fullOrderBook: fullOrderBook,
            start: startDate ? new Date(startDate).toISOString() : undefined,
            end: endDate ? new Date(endDate).toISOString() : undefined
        })

        fetch(url, {
            method: 'GET',
            headers: {
                GoogleToken: googleToken
            }
        })
            .then(async response => {
                if (!response.ok) {
                    const text = await response.text()
                    throw new Error(text || `Export failed with status ${response.status}`)
                }
                return response.blob()
            })
            .then(blob => {
                const downloadUrl = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = downloadUrl
                a.download = `bazaar-${props.itemTag}-export.zip`
                document.body.appendChild(a)
                a.click()
                a.remove()
                window.URL.revokeObjectURL(downloadUrl)
                props.onHide()
            })
            .catch(err => {
                alert('Export failed: ' + err.message)
            })
            .finally(() => {
                setIsExporting(false)
            })
    }

    return (
        <Modal show={props.show} onHide={handleModalHide} onEntered={onModalEntered} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>Export Bazaar Data</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {!isLoggedIn ? (
                    <div className={styles.centerPadded}>
                        <p>You need to be logged in to export bazaar data.</p>
                        <GoogleSignIn onAfterLogin={onLogin} />
                    </div>
                ) : !hasLoadedPremium ? (
                    <div className={styles.centerPadded}>Loading...</div>
                ) : (
                    <>
                        {premiumLoadError && (
                            <Alert variant="danger">
                                <p>Failed to load your premium status. Please try again.</p>
                                <Button size="sm" onClick={loadPremiumProducts}>
                                    Retry
                                </Button>
                            </Alert>
                        )}

                        {/* Tier info */}
                        <Alert variant={getTierVariant()}>
                            Your current tier: <strong>{getTierLabel()}</strong> — Max export history: <strong>{getMaxHistoryLabel()}</strong>
                        </Alert>

                        {!hasPremium && !hasPremiumPlus && (
                            <Alert variant="info">
                                Bazaar data export requires at least <strong>Premium</strong>. Exports of the last <strong>180 days</strong> are available with
                                Premium and data since October 2019 (<strong>{getExportHistoryYears()}</strong>) is available with Premium+.
                                <div className={styles.actionButtonContainer}>
                                    <Button href="/premium?tier=premium" variant="success" className="disableLinkStyle">
                                        Get Premium
                                    </Button>
                                </div>
                            </Alert>
                        )}

                        {hasPremium && !hasPremiumPlus && (
                            <Alert variant="info">
                                With Premium you can export up to the last <strong>180 days</strong> of data. Upgrade to <strong>Premium+</strong> for up to{' '}
                                <strong>{getExportHistoryYears()}</strong> of history (data since October 2019).
                                <div className={styles.actionButtonContainer}>
                                    <Button href="/premium?tier=premium_plus" variant="primary" className="disableLinkStyle">
                                        Upgrade to Premium+
                                    </Button>
                                </div>
                            </Alert>
                        )}

                        {hasPremiumPlus && (
                            <Alert variant="info">
                                With Premium+ you can export data since October 2019 (<strong>{getExportHistoryYears()}</strong> of bazaar data).
                            </Alert>
                        )}

                        <p className={styles.noteText}>
                            <strong>Note:</strong> If no date range is specified, the export will contain the last 2 weeks of data in 20-second increments. The
                            export will download as a zip file containing JSON.
                        </p>

                        {(hasPremium || hasPremiumPlus) && (
                            <Alert variant="secondary" className="mt-2">
                                <strong>Rate Limits:</strong> You can make up to <strong>5 cost units per 5 minutes</strong>.
                                A standard export costs <strong>1 unit</strong>. A full order book export costs <strong>3 units</strong>.
                                {hasPremium && !hasPremiumPlus && (
                                    <> Data resolution: <strong>5-minute increments</strong>.</>)}
                                {hasPremiumPlus && (
                                    <> Data resolution: <strong>20-second increments</strong> (last 2 weeks), <strong>5-minute increments</strong> (older data).</>)}
                            </Alert>
                        )}

                        <hr />

                        {/* Options */}
                        <div className={styles.formGroup}>
                            <Form.Group>
                                <Form.Label className={styles.label} htmlFor="fullOrderBook">
                                    Include full order book
                                </Form.Label>
                                <Form.Check
                                    onChange={event => setFullOrderBook(event.target.checked)}
                                    defaultChecked={fullOrderBook}
                                    id="fullOrderBook"
                                    className={styles.inlineElement}
                                    type="checkbox"
                                />
                            </Form.Group>
                        </div>

                        {(hasPremium || hasPremiumPlus) && (
                            <>
                                <div className={styles.formGroup}>
                                    <Form.Group>
                                        <Form.Label className={styles.label}>Start Date (optional)</Form.Label>
                                        <Form.Control 
                                            type="date" 
                                            value={startDate} 
                                            onChange={e => setStartDate(e.target.value)}
                                            min="2020-03-10"
                                        />
                                    </Form.Group>
                                </div>

                                <div className={styles.formGroup}>
                                    <Form.Group>
                                        <Form.Label className={styles.label}>End Date (optional)</Form.Label>
                                        <Form.Control 
                                            type="date" 
                                            value={endDate} 
                                            onChange={e => setEndDate(e.target.value)}
                                            max={getTodayDate()}
                                        />
                                    </Form.Group>
                                </div>

                                {isDateRangeExceedsYear() && (
                                    <Alert variant="warning">
                                        <strong>Note:</strong> Exporting more than a year at once can cause issues. We recommend keeping your time frame to about a year or less for best results.
                                    </Alert>
                                )}

                                {isStartDateExceeds180Days() && hasPremium && !hasPremiumPlus && (
                                    <Alert variant="warning">
                                        <strong>Note:</strong> The start date you selected is more than 180 days in the past. <strong>Premium+ is required</strong> to export data older than 180 days. Please upgrade to Premium+ or select a more recent start date.
                                        <div className={styles.actionButtonContainer}>
                                            <Button href="/premium?tier=premium_plus" variant="primary" size="sm" className="disableLinkStyle">
                                                Upgrade to Premium+
                                            </Button>
                                        </div>
                                    </Alert>
                                )}

                                <hr />

                                {/* License Disclaimer */}
                                <div className={styles.licenseContent}>
                                    <p><strong>License &amp; Data Usage Agreement</strong></p>
                                    <p>By downloading this data you agree to the following terms:</p>
                                    <ul>
                                        <li>
                                            <strong>Personal use only:</strong> The exported data is for personal use only and may not be redistributed, published, or
                                            shared with third parties.
                                        </li>
                                        <li>
                                            <strong>Data deletion:</strong> All exported data must be deleted when your premium tier expires or your subscription ends.
                                        </li>
                                        <li>
                                            <strong>Non-compete:</strong> You agree not to offer any competing services based on the exported data.
                                        </li>
                                        <li>
                                            <strong>Share findings:</strong> You agree to share any findings, analyses, or insights derived from the data with Coflnet.
                                        </li>
                                    </ul>
                                </div>
                            </>
                        )}
                    </>
                )}
            </Modal.Body>
            <Modal.Footer className={styles.modalFooter}>
                {!isLoggedIn || (!hasPremium && !hasPremiumPlus) ? (
                    <div className={styles.footerNote}>
                        {!isLoggedIn && 'Please log in to export bazaar data.'}
                        {isLoggedIn && !hasPremium && !hasPremiumPlus && premiumLoadError && (
                            'Unable to verify premium status. Please retry.'
                        )}
                        {isLoggedIn && !hasPremium && !hasPremiumPlus && !premiumLoadError && (
                            'Premium subscription required to export bazaar data. Click "Get Premium" above to upgrade.'
                        )}
                    </div>
                ) : (
                    <div className={styles.footerNote}>
                        By clicking Download, you accept the license agreement above.
                    </div>
                )}
                <Button variant="secondary" onClick={handleModalHide}>
                    Cancel
                </Button>
                <Button
                    variant="primary"
                    disabled={!isLoggedIn || (!hasPremium && !hasPremiumPlus) || isExporting}
                    onClick={startExport}
                    title={!isLoggedIn ? 'Please log in first' : (!hasPremium && !hasPremiumPlus) ? 'Premium subscription required' : ''}
                >
                    {isExporting ? 'Exporting...' : 'Accept Terms, Start and Download Export'}
                </Button>
            </Modal.Footer>
        </Modal>
    )
}

export default BazaarExportModal
