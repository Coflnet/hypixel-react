import { useRouter } from 'next/router'
import React, { useEffect } from 'react'
import { toast } from 'react-toastify'
import { getHeadElement } from '../utils/SSRUtils'

function Success() {
    let router = useRouter()

    useEffect(() => {
        toast.success(
            <>
                Payment successful
                <br />
                <small>Your payment is being handled securely by our payment provider. It may take a few minutes until your CoflCoins are credited</small>
            </>
        )
        router.push('/premium')
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return <div className="page">{getHeadElement('Payment successful')}</div>
}

export default Success
