import { useState } from 'react'
import { Badge, Button, OverlayTrigger, Popover } from 'react-bootstrap'
import { useMatomo } from '@jonkoops/matomo-tracker-react'
import ShareIcon from '@mui/icons-material/ShareOutlined'
import styles from './ShareButton.module.css'
import { v4 as generateUUID } from 'uuid'
import { canUseClipBoard, writeToClipboard } from '../../utils/ClipboardUtils'

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
        return typeof navigator !== 'undefined' && typeof navigator.share !== 'undefined'
    }

    function onShare() {
        navigator.share({
            title: props.title,
            text: props.text,
            url: props.url || window.location.href
        })
        trackEvent({
            category: 'share',
            action: 'shareAPI'
        })
    }

    function copyToClipboard() {
        if (canUseClipBoard()) {
            trackEvent({
                category: 'share',
                action: 'copyToClipboard'
            })
            writeToClipboard(window.location.href)
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
                        <Popover.Body>
                            <Badge bg="secondary">Copied to clipboard</Badge>
                        </Popover.Body>
                    </Popover>
                }
            >
                <Button onClick={canUseShareAPI ? onShare : copyToClipboard}>{<ShareIcon />} Share</Button>
            </OverlayTrigger>
        </div>
    )
}

export default ShareButton
