'use client'
import { useState } from 'react'
import { Spinner } from 'react-bootstrap'
import type { DiscountCodeState } from '../../../hooks/useDiscountCode'
import type { SlotCatalog } from '../../../hooks/useSlotCatalog'
import { CheckoutError, CodeDisclosure, CodeField, CreatorCodeMessage, DiscountCodeMessage } from '../Checkout/CheckoutParts'

interface Props {
    catalog: SlotCatalog
    discount: DiscountCodeState
    /** percent the creator code takes off the reviewed product */
    creatorPercent: number | null
}

function CreatorCodeStatus({ catalog, percent }: { catalog: SlotCatalog; percent: number | null }) {
    if (catalog.rejectedCreatorCode) return <CheckoutError>The creator code {catalog.rejectedCreatorCode} could not be applied</CheckoutError>
    if (!catalog.creatorCode || !catalog.canUsePrices) return null
    return <CreatorCodeMessage percent={percent} />
}

/** creator and discount code fields of the slot subscription review */
export default function SlotCodes({ catalog, discount, creatorPercent }: Props) {
    const [creatorInput, setCreatorInput] = useState(catalog.creatorCode)
    const [open, setOpen] = useState<boolean | null>(null)
    const pricesLoading = !catalog.canUsePrices && !catalog.pricingError
    const inUse = !!catalog.creatorCode || !!catalog.rejectedCreatorCode || !!discount.validated || !!discount.error || !!discount.code
    const isOpen = open ?? inUse
    const { validated, validating } = discount

    return (
        <CodeDisclosure open={isOpen} onToggle={() => setOpen(!isOpen)}>
            <CodeField
                label="Creator code (optional, supports a creator)"
                placeholder="Enter creator code"
                value={creatorInput}
                onChange={setCreatorInput}
                disabled={pricesLoading}
                actionLabel={pricesLoading ? <Spinner size="sm" animation="border" /> : 'Apply'}
                onAction={() => catalog.applyCreatorCode(creatorInput)}
                actionDisabled={pricesLoading || !creatorInput.trim()}
            >
                <CreatorCodeStatus catalog={catalog} percent={creatorPercent} />
            </CodeField>
            <CodeField
                label="Discount code"
                placeholder="Enter discount code"
                value={discount.code}
                onChange={discount.changeCode}
                disabled={validating}
                actionLabel={validated ? 'Clear' : validating ? <Spinner size="sm" animation="border" /> : 'Apply'}
                onAction={validated ? discount.clear : () => discount.validate()}
                actionDisabled={validating || (!validated && !discount.code.trim())}
            >
                <DiscountCodeMessage error={discount.error} discount={validated} />
            </CodeField>
        </CodeDisclosure>
    )
}
