'use client'
import Link from 'next/link'
import { Card } from 'react-bootstrap'
import { CancelOutlined as CancelIcon } from '@mui/icons-material'
import { useEffect, useState } from 'react'

export default function ModAdvert() {
    let [show, setShow] = useState(false)

    useEffect(() => {
        setShow(localStorage.getItem('hideModAdvertInFilter') !== 'true')
    }, [])

    function onClose() {
        setShow(false)
        localStorage.setItem('hideModAdvertInFilter', 'true')
    }

    if (!show) {
        return null
    }

    return (
        <>
            <Card style={{ marginBottom: '15px' }}>
                <Card.Header style={{ borderRadius: '5px' }}>
                    <Card.Text>
                        Checking item prices? We provide a mod showing market data like volume, lowest bin and median prices in game. <br />
                        <Link
                            href="/mod"
                            style={{
                                color: '#007bff',
                                cursor: 'pointer'
                            }}
                        >
                            Check out the mod
                        </Link>
                        <div style={{ position: 'absolute', top: 1, right: 5, color: 'red', cursor: 'pointer' }} onClick={onClose}>
                            <CancelIcon />
                        </div>
                    </Card.Text>
                </Card.Header>
            </Card>
            <hr />
        </>
    )
}
