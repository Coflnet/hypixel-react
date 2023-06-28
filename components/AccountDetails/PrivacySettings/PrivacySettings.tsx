'use client'
import { useEffect, useState } from 'react'
import { Form } from 'react-bootstrap'
import api from '../../../api/ApiHelper'
import { getLoadingElement } from '../../../utils/LoadingUtils'
import styles from './PrivacySettings.module.css'

function PrivacySettings() {
    let [privacySettings, setPrivacySettings] = useState<PrivacySettings | null>(null)

    useEffect(() => {
        loadPrivacySettings()
    }, [])

    function loadPrivacySettings() {
        api.getPrivacySettings().then(settings => {
            setPrivacySettings(settings)
        })
    }

    function onSettingChange(key: string, value: any) {
        if (!privacySettings) {
            return
        }
        privacySettings[key] = value
        setPrivacySettings(privacySettings)

        api.setPrivacySettings(privacySettings)
    }

    if (!privacySettings) {
        return getLoadingElement(<p>Loading settings</p>)
    }

    return (
        <>
            <p className={styles.settingsLine}>
                <span className={styles.label}>Allow Proxy: </span>
                <Form.Check
                    onChange={e => {
                        onSettingChange('allowProxy', e.target.checked)
                    }}
                    defaultChecked={privacySettings.allowProxy}
                    type="checkbox"
                />
            </p>
            <p className={styles.settingsLine}>
                <span className={styles.label}>Autostart: </span>
                <Form.Check
                    onChange={e => {
                        onSettingChange('autoStart', e.target.checked)
                    }}
                    defaultChecked={privacySettings.autoStart}
                    type="checkbox"
                />
            </p>
            <p className={styles.settingsLine}>
                <span className={styles.label}>Chat: </span>
                <Form.Check
                    onChange={e => {
                        onSettingChange('collectChat', e.target.checked)
                    }}
                    defaultChecked={privacySettings.collectChat}
                    type="checkbox"
                />
            </p>
            <p className={styles.settingsLine}>
                <span className={styles.label}>Chat clicks: </span>
                <Form.Check
                    onChange={e => {
                        onSettingChange('collectChatClicks', e.target.checked)
                    }}
                    defaultChecked={privacySettings.collectChatClicks}
                    type="checkbox"
                />
            </p>
            <p className={styles.settingsLine}>
                <span className={styles.label}>Entities: </span>
                <Form.Check
                    onChange={e => {
                        onSettingChange('collectEntities', e.target.checked)
                    }}
                    defaultChecked={privacySettings.collectEntities}
                    type="checkbox"
                />
            </p>
            <p className={styles.settingsLine}>
                <span className={styles.label}>Inventory clicks: </span>
                <Form.Check
                    onChange={e => {
                        onSettingChange('collectInvClick', e.target.checked)
                    }}
                    defaultChecked={privacySettings.collectInvClick}
                    type="checkbox"
                />
            </p>
            <p className={styles.settingsLine}>
                <span className={styles.label}>Inventory: </span>
                <Form.Check
                    onChange={e => {
                        onSettingChange('collectInventory', e.target.checked)
                    }}
                    defaultChecked={privacySettings.collectInventory}
                    type="checkbox"
                />
            </p>
            <p className={styles.settingsLine}>
                <span className={styles.label}>Lobby changes: </span>
                <Form.Check
                    onChange={e => {
                        onSettingChange('collectLobbyChanges', e.target.checked)
                    }}
                    defaultChecked={privacySettings.collectLobbyChanges}
                    type="checkbox"
                />
            </p>
            <p className={styles.settingsLine}>
                <span className={styles.label}>Scoreboard: </span>
                <Form.Check
                    onChange={e => {
                        onSettingChange('collectScoreboard', e.target.checked)
                    }}
                    defaultChecked={privacySettings.collectScoreboard}
                    type="checkbox"
                />
            </p>
            <p className={styles.settingsLine}>
                <span className={styles.label}>Tab: </span>
                <Form.Check
                    onChange={e => {
                        onSettingChange('collectTab', e.target.checked)
                    }}
                    defaultChecked={privacySettings.collectTab}
                    type="checkbox"
                />
            </p>
            <p className={styles.settingsLine}>
                <span className={styles.label}>Extend description: </span>
                <Form.Check
                    onChange={e => {
                        onSettingChange('extendDescriptions', e.target.checked)
                    }}
                    defaultChecked={privacySettings.extendDescriptions}
                    type="checkbox"
                />
            </p>
        </>
    )
}

export default PrivacySettings
