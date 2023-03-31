import React, { useEffect, useState } from 'react'
import { numberWithThousandsSeparators } from '../../utils/Formatter'

interface Props {
    number: number
}

export function Number(props: Props) {
    let [isSSR, setIsSSR] = useState(true)

    useEffect(() => {
        setIsSSR(false)
    }, [])

    return <>{isSSR ? numberWithThousandsSeparators(props.number, ',', '.') : numberWithThousandsSeparators(props.number)}</>
}
