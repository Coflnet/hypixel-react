import React, { useEffect, useRef } from 'react'
import FlipperComponent from '../components/Flipper/Flipper'
import { Container } from 'react-bootstrap'
import Search from '../components/Search/Search'
import { getHeadElement, isClientSideRendering } from '../utils/SSRUtils'
import Head from 'next/head'
import { parseFlipAuction } from '../utils/Parser/APIResponseParser'
import { initAPI } from '../api/ApiHelper'
import { handleSettingsImport } from '../utils/SettingsUtils'

interface Props {
    flips?: any[]
}

function Flipper(props: Props) {
    let dragCounter = useRef(0)

    function onDragStart(e) {
        e.preventDefault()
        dragCounter.current++
        console.log('on drag start')
    }

    function onDragEnd(e) {
        e.preventDefault()
        dragCounter.current--
        if (dragCounter.current === 0) {
            console.log('on drag end')
        }
    }

    function onDragOver(e) {
        let event = e as Event
        event.stopPropagation()
        event.preventDefault()
    }

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

    return (
        <div className="page" onDragEnter={onDragStart} onDragOver={onDragOver} onDragLeave={onDragEnd} onDrop={onDrop}>
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

export const getServerSideProps = async () => {
    let api = initAPI(true)
    let flips = await api.getPreloadFlips()
    return {
        props: {
            flips: flips
        }
    }
}

export default Flipper
