import React, { useEffect, useRef, useState } from 'react'
import { Card, Form } from 'react-bootstrap'
import * as SparkMD5 from 'spark-md5'
import api from '../../api/ApiHelper'
import { getLoadingElement } from '../../utils/LoadingUtils'

function RatChecker() {
    let [isChecking, setIsChecking] = useState(false)
    let [checkingResult, setCheckingResult] = useState<RatCheckingResponse>(null)
    let ratFileInput = useRef(null)

    useEffect(() => {
        ratFileInput.current.addEventListener('change', onFileUpload)

        return () => {
            ratFileInput.current.removeEventListener('change', onFileUpload)
        }
    }, [])

    function onFileUpload(e) {
        setIsChecking(true)

        var blobSlice = File.prototype.slice || (File.prototype as any).mozSlice || (File.prototype as any).webkitSlice,
            file = this.files[0],
            chunkSize = 2097152, // Read in chunks of 2MB
            chunks = Math.ceil(file.size / chunkSize),
            currentChunk = 0,
            spark = new SparkMD5.ArrayBuffer(),
            fileReader = new FileReader()

        fileReader.onload = function (e) {
            spark.append(e.target.result) // Append array buffer
            currentChunk++

            if (currentChunk < chunks) {
                loadNext()
            } else {
                let hash = spark.end()
                api.checkRat(hash).then(result => {
                    setIsChecking(false)
                    setCheckingResult(result)
                })
            }
        }

        fileReader.onerror = function () {
            console.warn('oops, something went wrong.')
        }

        function loadNext() {
            var start = currentChunk * chunkSize,
                end = start + chunkSize >= file.size ? file.size : start + chunkSize

            fileReader.readAsArrayBuffer(blobSlice.call(file, start, end))
        }

        loadNext()
    }

    function getResultElement(): JSX.Element {
        if (!checkingResult || isChecking) {
            return null
        }
        if (checkingResult.rat.includes('No matching signature')) {
            return (
                <p>
                    This mod file is not known. For further information check{' '}
                    <a target="_blank" rel="noreferrer" href="https://isthisarat.com/">
                        https://isthisarat.com/
                    </a>
                </p>
            )
        }
        if (checkingResult.rat.includes('Yes')) {
            return <p style={{ color: 'red', fontSize: 'larger' }}>This mod file seems to be a rat. Be careful!</p>
        }
        if (checkingResult.rat.includes('No')) {
            return <p style={{ color: 'lime', fontSize: 'larger' }}>This mod file doesn't seem to be a rat.</p>
        }
    }

    return (
        <>
            <Card>
                <Card.Header>
                    <Card.Title>Rat Checker</Card.Title>
                </Card.Header>
                <Card.Body>
                    <p>
                        Please only download the mod from our{' '}
                        <a target="_blank" rel="noreferrer" href="https://discord.gg/wvKXfTgCfb">
                            Discord
                        </a>
                        . The download link is in the #mod-releases channel.
                    </p>
                    {!isChecking ? (
                        <div>
                            <p>If you still want to check if a mod file is a RAT (remote access trojan), you can upload the file here:</p>
                            <Form.Control type="file" className={'form-control'} ref={ratFileInput} />
                        </div>
                    ) : (
                        getLoadingElement(<p>Checking file</p>)
                    )}
                    <hr />
                    <p style={{ float: 'right' }}>
                        <small>
                            Files are checked by{' '}
                            <a target="_blank" rel="noreferrer" href="https://isthisarat.com/">
                                isthisarat.com
                            </a>
                        </small>
                    </p>
                    {getResultElement()}
                </Card.Body>
            </Card>
        </>
    )
}

export default RatChecker
