'use client'
import React, { FC } from 'react'
import Card, { CardProps } from 'react-bootstrap/Card'

const RBCardTitle: FC<CardProps> = ({ children, ...props }) => {
    return <Card.Title {...props}>{children}</Card.Title>
}

export default RBCardTitle
