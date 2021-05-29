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
    tooltipTitle?: JSX.Element
}

function Tooltip(props: Props) {

    let [showDialog, setShowDialog] = useState(false);

    let hoverElement = (
        <OverlayTrigger
            overlay={<BootstrapTooltip id={generateUUID()}>
                {props.tooltipContent}
            </BootstrapTooltip>}>
            {props.content}
        </OverlayTrigger>
    );

    let clickElement = (
        <div>
            <div style={{cursor: "pointer"}} onClick={() => { setShowDialog(true) }}>
                {props.content}
            </div>
            <Modal show={showDialog} onHide={() => { setShowDialog(false) }}>
                <Modal.Header closeButton>
                    <Modal.Title>{props.tooltipTitle}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {props.tooltipContent}
                </Modal.Body>
            </Modal>
        </div>
    )

    return (
        <div className="tooltip-component">
            {
                props.type === "hover" ? hoverElement : clickElement
            }
        </div>
    );
}

export default Tooltip;