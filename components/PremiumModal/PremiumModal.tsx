"use client"
import React from 'react'
import { Modal, Button } from 'react-bootstrap'
import Link from 'next/link'

interface PremiumModalProps {
    show: boolean
    onHide: () => void
}

export default function PremiumModal({ show, onHide }: PremiumModalProps) {
    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>Get Starter Premium</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p>The top flips are available to users with Starter Premium or better.</p>
                <p>You can get Starter Premium for free via Linkvertise, or learn more on the Premium page.</p>
            </Modal.Body>
            <Modal.Footer>
                <a href="/linkvertise" className="btn btn-secondary" onClick={onHide}>
                    Get access to this for free
                </a>
                <a href="/premium" className="btn btn-primary" onClick={onHide} style={{ marginLeft: 8 }}>
                    Buy access (Premium)
                </a>
                <Button variant="light" onClick={onHide} style={{ marginLeft: 8 }}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    )
}
