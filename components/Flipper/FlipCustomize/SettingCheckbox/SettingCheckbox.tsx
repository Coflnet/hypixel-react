import React from 'react'
import { Form } from 'react-bootstrap'

interface SettingCheckboxProps {
    id: string
    label: string
    apiKey: string
    settingKey: string
    defaultChecked: boolean
    inverted?: boolean
    labelClass?: string
    updateApiSetting: (key: string, value: boolean) => void
    setFlipCustomizeSetting: (key: string, value: any) => void
}

/**
 * Reusable checkbox component for flip customization settings
 * @param inverted - If true, the setting value is inverted (unchecked = true in settings)
 */
function SettingCheckbox({
    id,
    label,
    apiKey,
    settingKey,
    defaultChecked,
    inverted = false,
    labelClass,
    updateApiSetting,
    setFlipCustomizeSetting
}: SettingCheckboxProps) {
    return (
        <Form.Group>
            <Form.Label className={labelClass} htmlFor={id}>
                {label}
            </Form.Label>
            <Form.Check
                onChange={event => {
                    const checkedValue = event.target.checked
                    const settingValue = inverted ? !checkedValue : checkedValue
                    updateApiSetting(apiKey, checkedValue)
                    setFlipCustomizeSetting(settingKey, settingValue)
                }}
                defaultChecked={defaultChecked}
                id={id}
                style={{ display: 'inline' }}
                type="checkbox"
            />
        </Form.Group>
    )
}

export default SettingCheckbox
