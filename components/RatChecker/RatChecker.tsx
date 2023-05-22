import { useRef, useState } from 'react'
import { Card, Form } from 'react-bootstrap'
import * as SparkMD5 from 'spark-md5'
import api from '../../api/ApiHelper'
import { getLoadingElement } from '../../utils/LoadingUtils'
import styles from './RatChecker.module.css'

function RatChecker() {
    let [isChecking, setIsChecking] = useState(false)
    let [checkingResults, setCheckingResults] = useState<[string, RatCheckingResponse][]>(null)
    let ratFileInput = useRef<HTMLInputElement>(null)

    function onFileUpload(files) {
        setIsChecking(true)
        let checkingPromises: Promise<[string, RatCheckingResponse]>[] = []

        for (const file of files) {
            checkingPromises.push(
                new Promise(resolve => {
                    generateSHA256FromFile(file).then(hash => {
                        api.checkRat(hash).then(result => resolve([file.name, result]))
                    })
                })
            )
        }

        Promise.all(checkingPromises).then(results => {
            setIsChecking(false)
            setCheckingResults(results)
            if (ratFileInput.current) {
                ratFileInput.current.value = ''
            }
        })
    }

    async function generateSHA256FromFile(file) {
        // Read the file as an ArrayBuffer
        const buffer = await file.arrayBuffer()
        // Convert ArrayBuffer to Uint8Array
        const data = new Uint8Array(buffer)

        // Generate SHA-256 hash
        const hashBuffer = await crypto.subtle.digest('SHA-256', data)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('')

        return hashHex
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
                                <span className={styles.checkedFileName}>{checkingResult[0]}</span>: No harmful code was found in this mod. It should be safe to
                                use.
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
                        <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
                            <p>
                                Received a suspicious (or any other mod) that you want to check? Select it here and get quick results for known rats or
                                legitimate mods (you can select multiple at once):
                            </p>
                            <Form.Control
                                type="file"
                                className={'form-control'}
                                style={{ display: 'none' }}
                                ref={ratFileInput}
                                onChange={e => onFileUpload((e.target as HTMLInputElement).files)}
                                multiple
                                accept=".jar"
                            />
                            <div
                                className={styles.dNd}
                                onClick={e => ratFileInput.current?.click()}
                                onDrop={e => {
                                    onFileUpload(e.dataTransfer.files)
                                    e.preventDefault()
                                }}
                                onDragOver={e => e.preventDefault()}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className={styles['dNd-content']}>Drag and Drop Files or click to open file</div>
                            </div>
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
