import React, { useRef, useState } from 'react'
import { Card, Form } from 'react-bootstrap'
import * as SparkMD5 from 'spark-md5'
import api from '../../api/ApiHelper'
import { getLoadingElement } from '../../utils/LoadingUtils'
import styles from './RatChecker.module.css'

function RatChecker() {
    let [isChecking, setIsChecking] = useState(false)
    let [checkingResults, setCheckingResults] = useState<[string, RatCheckingResponse][]>(null)
    let ratFileInput = useRef(null)

    function onFileUpload(e) {
        setIsChecking(true)
        let checkingPromises: Promise<[string, RatCheckingResponse]>[] = []

        for (const file of e.target.files) {
            checkingPromises.push(
                new Promise((resolve, reject) => {
                    getFileHash(file).then(hash => {
                        api.checkRat(hash).then(result => resolve([file.name, result]))
                    })
                })
            )
        }

        Promise.all(checkingPromises).then(results => {
            setIsChecking(false)
            setCheckingResults(results)
            ratFileInput.current.value = ''
        })
    }

    function getFileHash(file): Promise<string> {
        return new Promise((resolve, reject) => {
            var blobSlice = File.prototype.slice || (File.prototype as any).mozSlice || (File.prototype as any).webkitSlice,
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
                    resolve(hash)
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
        })
    }

    function getResultElement(): JSX.Element {
        if (!checkingResults || checkingResults.length === 0 || isChecking) {
            return null
        }
        return (
            <ul>
                {checkingResults.map(checkingResult => {
                    if (checkingResult[1].rat.includes('No matching signature')) {
                        return (
                            <li style={{ color: 'white', fontSize: 'large' }}>
                                <span className={styles.checkedFileName}>{checkingResult[0]}</span>: This mod file is not known. For further information check{' '}
                                <a target="_blank" rel="noreferrer" href="https://isthisarat.com/">
                                    https://isthisarat.com/
                                </a>
                            </li>
                        )
                    }
                    if (checkingResult[1].rat.includes('Yes')) {
                        return (
                            <li style={{ color: 'red', fontSize: 'large' }}>
                                <span className={styles.checkedFileName}>{checkingResult[0]}</span>: This mod is a known rat. We recommend against using it!
                            </li>
                        )
                    }
                    if (checkingResult[1].rat.includes('No')) {
                        return (
                            <li style={{ color: 'lime', fontSize: 'large' }}>
                                <span className={styles.checkedFileName}>{checkingResult[0]}</span>: No harmful code was found in this mod. It should be safe to use.
                            </li>
                        )
                    }
                    return null
                })}
            </ul>
        )
    }

    return (
        <>
            <Card>
                <Card.Header>
                    <Card.Title>Rat Checker</Card.Title>
                </Card.Header>
                <Card.Body>
                    {!isChecking ? (
                        <div>
                            <p>Received a suspicious (or any other mod) that you want to check? Select it here and get quick results for known rats or legitimate mods (you can select multiple at once):</p>
                            <Form.Control type="file" className={'form-control'} ref={ratFileInput} onChange={onFileUpload} multiple />
                        </div>
                    ) : (
                        getLoadingElement(<p>Checking file</p>)
                    )}
                    <hr />
                    {checkingResults && checkingResults.length > 0 && !isChecking ? (
                        <div>
                            <h5>Result:</h5>
                            {getResultElement()}
                            <p style={{ float: 'right' }}>
                                <small>
                                    File check is provided by{' '}
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
