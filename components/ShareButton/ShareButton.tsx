import React, { useState } from 'react'
import { Badge, Button, OverlayTrigger, Popover } from 'react-bootstrap'
import { useMatomo } from '@datapunt/matomo-tracker-react'
import { v4 as generateUUID } from 'uuid'
import { ShareOutlined as ShareIcon } from '@material-ui/icons'
import styles from './ShareButton.module.css'

interface Props {
    title: string
    text: string
    url?: string
}

function ShareButton(props: Props) {
    let { trackEvent } = useMatomo()

    let [canUseShareAPI, setCanUseShareAPI] = useState(checkShareAPI())
    let [showOverlayTrigger, setShowOverlayTrigger] = useState(false)

    function checkShareAPI(): boolean {
        return false
    }

    function onShare() {
        try {
            // navigator.share({ navigator.share !== undefined
            //     title: props.title,
            //     text: props.text,
            //     url: props.url || window.location.href
            // })
            trackEvent({
                category: 'share',
                action: 'shareAPI'
            })
        } catch (error) {
            setCanUseShareAPI(false)
            copyToClipboard()
        }
    }

    function copyToClipboard() {
        if (window.navigator.clipboard) {
            trackEvent({
                category: 'share',
                action: 'copyToClipboard'
            })
            window.navigator.clipboard.writeText(window.location.href)
            setShowOverlayTrigger(true)
        } else {
            trackEvent({
                category: 'share',
                action: 'noClipboardnoShareAPI'
            })
        }
    }

    return (
        <div className={styles.shareButton}>
            <OverlayTrigger
                show={showOverlayTrigger && !canUseShareAPI}
                trigger="click"
                placement="bottom-end"
                onEntered={() => setTimeout(() => setShowOverlayTrigger(false), 3000)}
                overlay={
                    <Popover id={generateUUID()}>
                        <Popover.Content>
                            <Badge variant="secondary">Copied to clipboard</Badge>
                        </Popover.Content>
                    </Popover>
                }
            >
                <Button onClick={canUseShareAPI ? onShare : copyToClipboard}>{<ShareIcon />} Share</Button>
            </OverlayTrigger>
        </div>
    )
}

export default ShareButton
