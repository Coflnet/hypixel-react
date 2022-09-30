import moment from 'moment'
import React, { useEffect, useState } from 'react'
import { getLocalDateAndTime } from '../../../utils/Formatter'
import { getHighestPriorityPremiumProduct, getPremiumType } from '../../../utils/PremiumTypeUtils'
import Tooltip from '../../Tooltip/Tooltip'
import styles from './PremiumStatus.module.css'

interface Props {
    products: PremiumProduct[]
    labelStyle?: React.CSSProperties
}

function PremiumStatus(props: Props) {
    let [highestPriorityProduct, setHighestPriorityProduct] = useState<PremiumProduct>(null)
    let [activeProducts, setActiveProducts] = useState<PremiumProduct[]>(null)

    useEffect(() => {
        setActiveProducts(props.products.filter(product => product.expires > new Date()))
        setHighestPriorityProduct(getHighestPriorityPremiumProduct(props.products))
    }, [props.products])

    function getProductListEntry(product: PremiumProduct) {
        return (
            <>
                <span>{getPremiumType(product).label}</span>
                <Tooltip
                    type="hover"
                    content={<span> (ends {moment(product.expires).fromNow()})</span>}
                    tooltipContent={<span>{getLocalDateAndTime(product.expires)}</span>}
                />
            </>
        )
    }

    return (
        <>
            <div>
                {activeProducts?.length > 1 ? (
                    <div style={{ overflow: 'hidden' }}>
                        <span className={styles.premiumStatusLabel} style={props.labelStyle}>
                            Premium-Status:
                        </span>
                        <ul style={{ float: 'left' }}>
                            {activeProducts.map(product => (
                                <li>{getProductListEntry(product)}</li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <p>
                        {' '}
                        <span className={styles.premiumStatusLabel} style={props.labelStyle}>
                            Premium-Status:
                        </span>
                        {highestPriorityProduct ? getProductListEntry(highestPriorityProduct) : 'No Premium'}
                    </p>
                )}
            </div>
        </>
    )
}

export default PremiumStatus
