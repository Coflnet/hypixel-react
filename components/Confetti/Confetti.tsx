'use client'
import { useEffect, useState } from 'react'
import ReactConfetti, { Props } from 'react-confetti'

export default function Confetti(props: Props) {
    let [isSSR, setIsSSR] = useState(true)

    useEffect(() => {
        setIsSSR(false)
    }, [])

    return !isSSR ? <ReactConfetti {...props} width={window.innerWidth} height={window.innerHeight} /> : null
}
