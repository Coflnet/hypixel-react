import React, { useState } from 'react';
import './ShareButton.css';
import { Badge, Button, OverlayTrigger, Popover } from 'react-bootstrap';
import { v4 as generateUUID } from 'uuid';

interface Props {
    title: string,
    text: string,
    url?: string
}

function ShareButton(props: Props) {

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
        } catch (error) {
            setCanUseShareAPI(false);
            copyToClipboard();
        }
    }

    function copyToClipboard() {
        window.navigator.clipboard.writeText(window.location.href);
        setShowOverlayTrigger(true)
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
                <Button onClick={canUseShareAPI ? onShare : copyToClipboard}>Share</Button>
            </OverlayTrigger>
        </div >
    );
}

export default ShareButton;
