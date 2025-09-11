'use client'
import { useState, useEffect } from 'react'
import { Button, Alert, Card } from 'react-bootstrap'
import { enableGooglePlayStoreModeForTesting, disableGooglePlayStoreModeForTesting, isGooglePlayBillingAvailable } from '../../utils/PlatformUtils'

/**
 * Development tool for testing Google Play Store payments
 * This component should only be visible in development mode
 */
function GooglePlayTestingUtils() {
    const [isTestingMode, setIsTestingMode] = useState(false)
    const [isGooglePlayMode, setIsGooglePlayMode] = useState(false)

    useEffect(() => {
        // Only show in development
        const isDev = process.env.NODE_ENV === 'development'
        setIsTestingMode(isDev)
        
        // Check current state
        setIsGooglePlayMode(isGooglePlayBillingAvailable())
    }, [])

    const handleEnableGooglePlay = () => {
        enableGooglePlayStoreModeForTesting()
        setIsGooglePlayMode(true)
        window.location.reload() // Reload to apply changes
    }

    const handleDisableGooglePlay = () => {
        disableGooglePlayStoreModeForTesting()
        setIsGooglePlayMode(false)
        window.location.reload() // Reload to apply changes
    }

    if (!isTestingMode) {
        return null
    }

    return (
        <Card style={{ margin: '20px 0', border: '2px dashed #ffc107' }}>
            <Card.Header style={{ backgroundColor: '#fff3cd' }}>
                <Card.Title style={{ color: '#856404', margin: 0 }}>
                    🧪 Development Testing Tools
                </Card.Title>
            </Card.Header>
            <Card.Body>
                <Alert variant="warning" style={{ marginBottom: '15px' }}>
                    <strong>Development Mode Only:</strong> These tools are for testing Google Play Store functionality
                    during development. They will not appear in production.
                </Alert>

                <div style={{ marginBottom: '15px' }}>
                    <strong>Current State:</strong>{' '}
                    <span style={{ 
                        color: isGooglePlayMode ? '#28a745' : '#dc3545',
                        fontWeight: 'bold'
                    }}>
                        {isGooglePlayMode ? 'Google Play Mode Enabled' : 'Google Play Mode Disabled'}
                    </span>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <Button
                        variant={isGooglePlayMode ? 'outline-success' : 'success'}
                        onClick={handleEnableGooglePlay}
                        disabled={isGooglePlayMode}
                    >
                        {isGooglePlayMode ? '✓ Google Play Enabled' : 'Enable Google Play Mode'}
                    </Button>
                    
                    <Button
                        variant={!isGooglePlayMode ? 'outline-secondary' : 'secondary'}
                        onClick={handleDisableGooglePlay}
                        disabled={!isGooglePlayMode}
                    >
                        Disable Google Play Mode
                    </Button>
                </div>

                <div style={{ marginTop: '15px', fontSize: '14px', color: '#6c757d' }}>
                    <strong>What this does:</strong>
                    <ul style={{ marginTop: '5px', marginBottom: 0 }}>
                        <li>Simulates Google Play Store PWA environment</li>
                        <li>Shows Google Play payment options instead of Stripe/PayPal</li>
                        <li>Displays the two CoflCoins bundles (1800 for €9.69, 5400 for €24.69)</li>
                        <li>Useful for testing UI/UX before Play Store deployment</li>
                    </ul>
                </div>
            </Card.Body>
        </Card>
    )
}

export default GooglePlayTestingUtils
