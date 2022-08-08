import React, { useEffect, useRef } from 'react'
import { Card, Form } from 'react-bootstrap'
import * as SparkMD5 from 'spark-md5'

function RatChecker() {
    let ratFileInput = useRef(null)

    useEffect(() => {
        ratFileInput.current.addEventListener('change', onFileUpload)

        return () => {
            ratFileInput.current.removeEventListener('change', onFileUpload)
        }
    }, [])

    function onFileUpload(e) {
        var blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice,
            file = this.files[0],
            chunkSize = 2097152, // Read in chunks of 2MB
            chunks = Math.ceil(file.size / chunkSize),
            currentChunk = 0,
            spark = new SparkMD5.ArrayBuffer(),
            fileReader = new FileReader()

        fileReader.onload = function (e) {
            console.log('read chunk nr', currentChunk + 1, 'of', chunks)
            spark.append(e.target.result) // Append array buffer
            currentChunk++

            if (currentChunk < chunks) {
                loadNext()
            } else {
                console.log('finished loading')
                console.info('computed hash', spark.end()) // Compute hash
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
                    <p>If you still want to check if a mod file is a RAT (remote access trojan), you can upload the file here:</p>
                    <Form.Control type="file" className={'form-control'} ref={ratFileInput} />
                    <hr />
                </Card.Body>
            </Card>
        </>
    )
}

export default RatChecker
