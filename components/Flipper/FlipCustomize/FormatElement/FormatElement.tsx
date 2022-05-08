import { useMatomo } from '@datapunt/matomo-tracker-react'
import React, { ChangeEvent, useEffect, useRef } from 'react'
import { Button, Form } from 'react-bootstrap'
import { DEFAULT_MOD_FORMAT } from '../../../../utils/FlipUtils'
import Tooltip from '../../../Tooltip/Tooltip'
import { Refresh as RefreshIcon, Help as HelpIcon } from '@mui/icons-material'
import { useForceUpdate } from '../../../../utils/Hooks'
import styles from './FormatElement.module.css'

interface Props {
    onChange(value: string)
    settings: FlipCustomizeSettings
    labelClass?: string
}

function FormatElement(props: Props) {
    let formatExampleRef = useRef(null)
    let formatInputRef = useRef(null)
    let forceUpdate = useForceUpdate()

    let { trackEvent } = useMatomo()

    useEffect(() => {
        renderFormatExampleText()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    function onChange(value: string) {
        props.onChange(value)
        forceUpdate()
        setTimeout(() => {
            renderFormatExampleText()
        }, 0)
    }

    function onModDefaultFormatCheckboxChange(event) {
        if (event.target.checked) {
            setDefaultModFormat()
        } else {
            onChange('')
        }
    }

    function setDefaultModFormat() {
        if (formatInputRef.current) {
            ;(formatInputRef.current! as HTMLInputElement).value = DEFAULT_MOD_FORMAT
        }
        onChange(DEFAULT_MOD_FORMAT)
        trackEvent({
            category: 'customizeFlipStyle',
            action: 'modFormat: default'
        })
    }

    function onInputChange(e: ChangeEvent<HTMLInputElement>) {
        onChange(e.target.value)
    }

    function renderFormatExampleText() {
        let settings = props.settings
        if (!settings.modFormat) {
            return ''
        }

        var values = {
            '0': 'FLIP',
            '1': '§2',
            '2': 'Armadillo',
            '3': '§1',
            '4': settings.shortNumbers ? '1.49M' : '1.490.000',
            '5': settings.shortNumbers ? '2M' : '2.000.000',
            '6': settings.shortNumbers ? '470k' : '470.000',
            '7': '31%',
            '8': settings.shortNumbers ? '2M' : '2.000.000',
            '9': settings.shortNumbers ? '1M' : '1.000.000',
            '10': '26'
        }

        let resultText = settings.modFormat.replace(/\{([^}]+)\}/g, function (i, match) {
            return values[match]
        })

        // Timeout, to wait for the react-render, as the modFormat may have been hidden before
        setTimeout(() => {
            if (formatExampleRef.current) {
                ;(formatExampleRef.current! as HTMLElement).innerHTML = ''
                ;(formatExampleRef.current! as HTMLElement).appendChild((resultText as any).replaceColorCodes())
            }
        }, 0)
    }

    const formatHelpTooltip = (
        <div>
            <p>The format, the mod displays messages. The followig symbols are replaced by the actual values:</p>
            <ul>
                <li>&#123;0&#125; FlipFinder</li>
                <li>&#123;1&#125; Item Rarity Color</li>
                <li>&#123;2&#125; Item Name</li>
                <li>&#123;3&#125; Price color</li>
                <li>&#123;4&#125; Starting bid</li>
                <li>&#123;5&#125; Target Price</li>
                <li>&#123;6&#125; Estimated Profit</li>
                <li>&#123;7&#125; Profit percentage</li>
                <li>&#123;8&#125; Median Price</li>
                <li>&#123;9&#125; Lowest Bin</li>
                <li>&#123;10&#125; Volume</li>
            </ul>
            <p>It uses the default format if unchecked.</p>
        </div>
    )

    return (
        <div>
            <label htmlFor="modFormat" className={styles.label}>
                Custom format
                <Tooltip type="hover" content={<HelpIcon style={{ color: '#007bff', cursor: 'pointer' }} />} tooltipContent={formatHelpTooltip} />
            </label>
            <Form.Check
                onChange={onModDefaultFormatCheckboxChange}
                defaultChecked={!!props.settings.modFormat}
                id="modFormat"
                style={{ display: 'inline' }}
                type="checkbox"
            />
            {props.settings.modFormat ? (
                <div>
                    <div style={{ display: 'flex' }}>
                        <Form.Control
                            as="textarea"
                            ref={formatInputRef}
                            style={{ width: '100%' }}
                            onChange={onInputChange}
                            defaultValue={props.settings.modFormat}
                        />
                        <Button style={{ whiteSpace: 'nowrap' }} onClick={setDefaultModFormat}>
                            <RefreshIcon />
                            Default
                        </Button>
                    </div>
                    <p ref={formatExampleRef} />
                </div>
            ) : null}
        </div>
    )
}

export default FormatElement
