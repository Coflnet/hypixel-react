import React, { useState } from 'react';
import { Modal, OverlayTrigger, Tooltip as BootstrapTooltip } from 'react-bootstrap';
import './Tooltip.css'
import { v4 as generateUUID } from 'uuid';

/**
 * type: if the tooltip is a regular tooltip or should be clicked at (popup)
 * content: the content that is initally displayed (e.g. a ?-Symbol)
 * tooltipContent: the content that is displayed after the activation (onHover or onClick)
 * tooltipTitle: only used as the title in the popup-Dilog
 */
interface Props {
    type: "hover" | "click",
    content: JSX.Element,
    tooltipContent: JSX.Element,
    tooltipTitle?: JSX.Element,
    size?: "sm" | "lg" | "xl",
    onClick?: Function,
    id?: any
}

function Tooltip(props: Props) {

    let [showDialog, setShowDialog] = useState(false);
    let hoverElement = (
        <OverlayTrigger
            overlay={<BootstrapTooltip id={props.id || generateUUID()}>
                {props.tooltipContent}
            </BootstrapTooltip>}>
            {props.content}
        </OverlayTrigger>
    );

    function onClick() {
        setShowDialog(true)
        if (props.onClick) {
            props.onClick();
        }
    }

    let clickElement = (
        <span>
            <span style={{ cursor: "pointer" }} onClick={onClick}>
                {props.content}
            </span>
            <Modal size={props.size || "lg"} show={showDialog} onHide={() => { setShowDialog(false) }}>
                <Modal.Header closeButton>
                    <Modal.Title>{props.tooltipTitle}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {props.tooltipContent}
                </Modal.Body>
            </Modal>
        </span>
    )

    return props.type === "hover" ? hoverElement : clickElement
}

export default Tooltip;