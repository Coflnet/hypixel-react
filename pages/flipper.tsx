import React, { useEffect, useRef } from 'react'
import FlipperComponent from '../components/Flipper/Flipper'
import { Container } from 'react-bootstrap'
import Search from '../components/Search/Search'
import { getHeadElement, isClientSideRendering } from '../utils/SSRUtils'
import Head from 'next/head'
import { parseFlipAuction } from '../utils/Parser/APIResponseParser'
import { initAPI } from '../api/ApiHelper'
import { handleSettingsImport } from '../utils/SettingsUtils'
import { getCacheContolHeader } from '../utils/CacheUtils'

interface Props {
    flips?: any[]
}

function Flipper(props: Props) {
    function onDrop(e) {
        e.preventDefault()
        var output = '' //placeholder for text output
        let reader = new FileReader()
        let file = e.dataTransfer.items[0].getAsFile()
        if (file) {
            reader.onload = function (e) {
                output = e.target!.result!.toString()
                handleSettingsImport(output)
                //handleSettingsImport(output)
            } //end onload()
            reader.readAsText(file)
        }
        return true
    }

    function onDragOver(e) {
        e.preventDefault()
    }

    return (
        <div className="page" onDragOver={onDragOver} onDrop={onDrop}>
            {getHeadElement(undefined, 'Free auction house item flipper for Hypixel Skyblock', undefined, ['flipper'])}
            <Container>
                <Search />
                <h2>Item-Flipper (WIP)</h2>
                <hr />
                <FlipperComponent flips={props.flips?.map(parseFlipAuction)} />
            </Container>
        </div>
    )
}

export const getServerSideProps = async ({ res }) => {
    res.setHeader('Cache-Control', getCacheContolHeader())

    let api = initAPI(true)
    let flips = await api.getPreloadFlips()
    return {
        props: {
            flips: flips || []
        }
    }
}

export default Flipper
