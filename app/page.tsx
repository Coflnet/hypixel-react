import React from 'react'
import StartpageComponent from '../components/Startpage/Startpage'
import Search from '../components/Search/Search'
import { getHeadMetadata } from '../utils/SSRUtils'
import { Container } from 'react-bootstrap'
import FavoriteItemsBar from '../components/Favorites/FavoriteItemsBar'

export default async function Page() {
    return (
        <>
            <Container>
                <Search />
                <FavoriteItemsBar />
                <StartpageComponent />
            </Container>
        </>
    )
}

export const metadata = getHeadMetadata()
