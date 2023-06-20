'use client'

import React, { FC } from 'react'
import Card, { CardProps } from 'react-bootstrap/Card'

const RBCard: FC<CardProps> = ({ children, ...props }) => {
    return <Card {...props}>{children}</Card>
}

export default RBCard
