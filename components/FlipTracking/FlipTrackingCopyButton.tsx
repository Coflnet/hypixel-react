'use client'

import { useSearchParams } from 'next/navigation'
import { CopyButton } from '../CopyButton/CopyButton'
import { isClientSideRendering } from '../../utils/SSRUtils'

interface Props {
    trackedFlip: FlipTrackingFlip
}

export default function FlipTrackingCopyButton({ trackedFlip }: Props) {
    let searchParams = useSearchParams()

    return (
        <CopyButton
            copyValue={isClientSideRendering() ? `${window.location.origin}/player/${searchParams.get('uuid')}/flips/${trackedFlip.uId.toString(16)}` : ''}
            successMessage={isClientSideRendering() ? <span>{`Copied link to flip!`}</span> : <span />}
        />
    )
}
