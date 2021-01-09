import React, { useState } from 'react';
import './ShareButton.css';
import { Badge, Button, OverlayTrigger, Popover } from 'react-bootstrap';
import { useMatomo } from '@datapunt/matomo-tracker-react';
import { v4 as generateUUID } from 'uuid';

interface Props {
    title: string,
    text: string,
    url?: string
}

function ShareButton(props: Props) {

    let { trackEvent } = useMatomo();

    let [canUseShareAPI, setCanUseShareAPI] = useState(checkShareAPI());
    let [showOverlayTrigger, setShowOverlayTrigger] = useState(false);

    function checkShareAPI(): boolean {
        return navigator.share !== undefined;
    }

    function onShare() {
        try {
            navigator.share({
                title: props.title,
                text: props.text,
                url: props.url || window.location.href
            })
            trackEvent({
                category: 'share',
                action: 'shareAPI'
            })
        } catch (error) {
            setCanUseShareAPI(false);
            copyToClipboard();
        }
    }

    function copyToClipboard() {
        if (window.navigator.clipboard) {
            trackEvent({
                category: 'share',
                action: 'copyToClipboard'
            })
            window.navigator.clipboard.writeText(window.location.href);
            setShowOverlayTrigger(true);
        } else {
            trackEvent({
                category: 'share',
                action: 'noClipboardnoShareAPI'
            })
        }
    }

    function shareIcon() {
        return (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-share" viewBox="0 0 16 16">
            <path d="M13.5 1a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.499 2.499 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5zm-8.5 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm11 5.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z" />
        </svg>);
    }

    return (
        <div className="share-button">
            <OverlayTrigger show={showOverlayTrigger && !canUseShareAPI} trigger="click" placement="bottom-end" onEntered={() => setTimeout(() => setShowOverlayTrigger(false), 3000)} overlay={
                <Popover id={generateUUID()}>
                    <Popover.Content>
                        <Badge variant="secondary">Copied to clipboard</Badge>
                    </Popover.Content>
                </Popover>
            }>
                <Button onClick={canUseShareAPI ? onShare : copyToClipboard}>{shareIcon()} Share</Button>
            </OverlayTrigger>
        </div >
    );
}

export default ShareButton;
