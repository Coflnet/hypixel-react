'use client'
import Link from 'next/link'
import { Button, Container } from 'react-bootstrap'
import { getHeadMetadata } from '../utils/SSRUtils'
import RBContainer from '../components/ReactBootstrapWrapper/Container'
import RBButton from '../components/ReactBootstrapWrapper/Button'

export default function NotFound() {
    return (
        <>
            <RBContainer>
                <h1>Oops, seems something went wrong</h1>
                <p>There is nothing to see here.</p>
                <p>
                    <small>Error 404</small>
                </p>
                <Link href="/" className="disableLinkStyle">
                    <RBButton>Go back</RBButton>
                </Link>
            </RBContainer>
        </>
    )
}

export const metadata = getHeadMetadata('Not found')
