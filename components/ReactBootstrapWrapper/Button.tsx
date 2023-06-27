'use client'
import React, { FC } from 'react'
import Button, { ButtonProps } from 'react-bootstrap/Button'

const RBButton: FC<ButtonProps> = ({ children, ...props }) => {
    return <Button {...props}>{children}</Button>
}

export default RBButton
