'use client'
import dynamic from 'next/dynamic'
import { Container } from 'react-bootstrap'
import Search from '../../../components/Search/Search'
import { ReactNode } from 'react'

const LoopDetectionBanner = dynamic(() => import('../../../components/LoopDetectionBanner/LoopDetectionBanner'), {
    ssr: false
})

interface Props {
    item: Item
    children: ReactNode
}

export function ItemPageClient({ item, children }: Props) {
    return (
        <>
            <LoopDetectionBanner />
            <Container>
                <Search selected={item} type="item" showFavoriteToggle />
                {children}
            </Container>
        </>
    )
}
