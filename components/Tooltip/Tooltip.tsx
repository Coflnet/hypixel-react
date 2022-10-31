import React, { useState } from 'react'
import { Modal, OverlayTrigger, Tooltip as BootstrapTooltip } from 'react-bootstrap'
import { v4 as generateUUID } from 'uuid'

/**
 * type: if the tooltip is a regular tooltip or should be clicked at (popup)
 * content: the content that is initally displayed (e.g. a ?-Symbol)
 * tooltipContent: the content that is displayed after the activation (onHover or onClick)
 * tooltipTitle: only used as the title in the popup-Dilog
 */
interface Props {
    type: 'hover' | 'click'
    content: JSX.Element
    tooltipContent: JSX.Element
    tooltipTitle?: JSX.Element
    size?: 'sm' | 'lg' | 'xl'
    onClick?: Function
    id?: any
    hoverPlacement?: any
}

function Tooltip(props: Props) {
    let [showDialog, setShowDialog] = useState(false)

    function getHoverElement() {
        return props.tooltipContent ? (
            <OverlayTrigger
                overlay={
                    <BootstrapTooltip id={props.id || generateUUID()} className={props.className}>
                        {props.tooltipContent}
                    </BootstrapTooltip>
                }
                placement={props.hoverPlacement}
            >
                {props.content}
            </OverlayTrigger>
        ) : (
            props.content
        )
    }

    function onClick() {
        setShowDialog(true)
        if (props.onClick) {
            props.onClick()
        }
    }

    function getClickElement() {
        return props.tooltipContent || props.tooltipTitle ? (
            <span className="tooltipWrapper">
                <span style={{ cursor: 'pointer' }} onClick={onClick}>
                    {props.content}
                </span>
                <Modal
                    size={props.size || 'lg'}
                    show={showDialog}
                    onHide={() => {
                        setShowDialog(false)
                    }}
                >
                    <Modal.Header closeButton>
                        <Modal.Title>{props.tooltipTitle}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>{props.tooltipContent}</Modal.Body>
                </Modal>
            </span>
        ) : (
            props.content
        )
    }

    return props.type === 'hover' ? getHoverElement() : getClickElement()
}

export default Tooltip
