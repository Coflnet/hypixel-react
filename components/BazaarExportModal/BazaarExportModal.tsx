'use client'
import { useState } from 'react'
import { Alert, Button, Form, Modal } from 'react-bootstrap'
import api from '../../api/ApiHelper'
import { hasHighEnoughPremium, PREMIUM_RANK } from '../../utils/PremiumTypeUtils'
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

    function handleEnter() {
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
        handleEnter()
    }

    function handleModalHide() {
        // Reset form state when modal closes
        setFullOrderBook(false)
        setStartDate('')
        setEndDate('')
        setIsExporting(false)
        props.onHide()
    }

    function getMaxHistoryLabel(): string {
        if (hasPremiumPlus) return '~6 years'
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

        const params = new URLSearchParams()
        params.append('fullOrderBook', fullOrderBook.toString())
        if (startDate) {
            params.append('start', new Date(startDate).toISOString())
        }
        if (endDate) {
            params.append('end', new Date(endDate).toISOString())
        }

        const url = `https://sky.coflnet.com/api/bazaar/${props.itemTag}/export?${params.toString()}`

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
        <Modal show={props.show} onHide={handleModalHide} onEntered={handleEnter} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>Export Bazaar Data</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {!isLoggedIn ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                        <p>You need to be logged in to export bazaar data.</p>
                        <GoogleSignIn onAfterLogin={onLogin} />
                    </div>
                ) : !hasLoadedPremium ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>
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
                                Premium and the last <strong>~6 years</strong> are available with Premium+.
                                <div style={{ marginTop: '10px' }}>
                                    <Button href="/premium?tier=premium" variant="success">
                                        Get Premium
                                    </Button>
                                </div>
                            </Alert>
                        )}

                        {hasPremium && !hasPremiumPlus && (
                            <Alert variant="info">
                                With Premium you can export up to the last <strong>180 days</strong> of data. Upgrade to <strong>Premium+</strong> for up to{' '}
                                <strong>~6 years</strong> of history.
                                <div style={{ marginTop: '10px' }}>
                                    <Button href="/premium?tier=premium_plus" variant="warning">
                                        Upgrade to Premium+
                                    </Button>
                                </div>
                            </Alert>
                        )}

                        {hasPremiumPlus && (
                            <Alert variant="info">
                                With Premium+ you can export up to the last <strong>~6 years</strong> of bazaar data.
                            </Alert>
                        )}

                        <p className={styles.noteText}>
                            <strong>Note:</strong> If no date range is specified, the export will contain the last 2 weeks of data in 20-second increments. The
                            export will download as a zip file containing JSON.
                        </p>

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
                                    style={{ display: 'inline' }}
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
                                        <div style={{ marginTop: '10px' }}>
                                            <Button href="/premium?tier=premium_plus" variant="warning" size="sm">
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
            <Modal.Footer style={{ flexWrap: 'wrap', gap: '10px' }}>
                {!isLoggedIn || (!hasPremium && !hasPremiumPlus) ? (
                    <div style={{ width: '100%', marginBottom: '10px', fontSize: '0.85rem', color: '#666' }}>
                        {!isLoggedIn && 'Please log in to export bazaar data.'}
                        {isLoggedIn && !hasPremium && !hasPremiumPlus && premiumLoadError && (
                            'Unable to verify premium status. Please retry.'
                        )}
                        {isLoggedIn && !hasPremium && !hasPremiumPlus && !premiumLoadError && (
                            'Premium subscription required to export bazaar data. Click "Get Premium" above to upgrade.'
                        )}
                    </div>
                ) : (
                    <div style={{ width: '100%', marginBottom: '10px', fontSize: '0.85rem', color: '#666' }}>
                        By clicking Download, you accept the license agreement above.
                    </div>
                )}
                <Button variant="outline-secondary" onClick={handleModalHide}>
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
