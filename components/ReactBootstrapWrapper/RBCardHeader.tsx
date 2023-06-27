'use client'
import React, { FC } from 'react'
import CardHeader, { CardHeaderProps } from 'react-bootstrap/CardHeader'

const RBCardHeader: FC<CardHeaderProps> = ({ children, ...props }) => {
    return <CardHeader {...props}>{children}</CardHeader>
}

export default RBCardHeader
