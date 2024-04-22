'use client'
import React, { useEffect, useState } from 'react'
import { numberWithThousandsSeparators } from '../../utils/Formatter'

interface Props {
    number: number | string
}

export default function NumberElement(props: Props) {
    let [isSSR, setIsSSR] = useState(true)

    let value = Number(props.number)

    useEffect(() => {
        setIsSSR(false)
    }, [])

    return <>{isSSR ? numberWithThousandsSeparators(value, ',', '.') : numberWithThousandsSeparators(value)}</>
}
