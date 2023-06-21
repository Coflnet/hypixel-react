'use client'
import React, { FC } from 'react'
import Container, { ContainerProps } from 'react-bootstrap/Container'

const RBContainer: FC<ContainerProps> = ({ children, ...props }) => {
    return <Container {...props}>{children}</Container>
}

export default RBContainer
