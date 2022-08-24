import React, { useEffect, useRef, useState } from 'react'
import { Card, Form } from 'react-bootstrap'
import * as SparkMD5 from 'spark-md5'
import api from '../../api/ApiHelper'
import { getLoadingElement } from '../../utils/LoadingUtils'

function RatChecker() {
    let [isChecking, setIsChecking] = useState(false)
    let [checkingResult, setCheckingResult] = useState<RatCheckingResponse>(null)
    let ratFileInput = useRef(null)

    function onFileUpload(e) {
        setIsChecking(true)

        var blobSlice = File.prototype.slice || (File.prototype as any).mozSlice || (File.prototype as any).webkitSlice,
            file = e.target.files[0],
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
                    ratFileInput.current.value = ''
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
                <p style={{ color: 'white', fontSize: 'larger' }}>
                    This mod file is not known. For further information check{' '}
                    <a target="_blank" rel="noreferrer" href="https://isthisarat.com/">
                        https://isthisarat.com/
                    </a>
                </p>
            )
        }
        if (checkingResult.rat.includes('Yes')) {
            return <p style={{ color: 'red', fontSize: 'larger' }}>This mod is a known rat. We recommend against using it!</p>
        }
        if (checkingResult.rat.includes('No')) {
            return <p style={{ color: 'lime', fontSize: 'larger' }}>No harmful code was found in this mod. It should be safe to use.</p>
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
                            <Form.Control type="file" className={'form-control'} ref={ratFileInput} onChange={onFileUpload} />
                        </div>
                    ) : (
                        getLoadingElement(<p>Checking file</p>)
                    )}
                    <hr />
                    {checkingResult && !isChecking ? (
                        <div>
                            <h5>Result:</h5>
                            {getResultElement()}
                            <p style={{ float: 'right' }}>
                                <small>
                                    Files are checked by{' '}
                                    <a target="_blank" rel="noreferrer" href="https://isthisarat.com/">
                                        isthisarat.com
                                    </a>
                                </small>
                            </p>
                        </div>
                    ) : null}
                </Card.Body>
            </Card>
        </>
    )
}

export default RatChecker
