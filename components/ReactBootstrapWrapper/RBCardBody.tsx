'use client'
import React, { FC } from 'react'
import Card, { CardProps } from 'react-bootstrap/Card'

const RBCardBody: FC<CardProps> = ({ children, ...props }) => {
    return <Card.Body {...props}>{children}</Card.Body>
}

export default RBCardBody
