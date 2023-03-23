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
    let [productsToShow, setProductsToShow] = useState<PremiumProduct[]>(null)

    useEffect(() => {
        let products = props.products

        // Hide lower tier products that are most likely bought automatically together (<1min time difference)
        if (products.length > 1) {
            for (let i = 1; i < products.length; i++) {
                if (Math.abs(products[i - 1].expires.getTime() - products[i].expires.getTime()) < 60000) {
                    if (getPremiumType(products[i - 1]).priority > getPremiumType(products[i]).priority) {
                        products.splice(i, 1)
                    } else {
                        products.splice(i - 1, 1)
                    }
                    i = 0
                }
            }
        }

        products = products.filter(product => product.expires > new Date())
        setProductsToShow(products)
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
                {productsToShow?.length > 1 ? (
                    <div style={{ overflow: 'hidden' }}>
                        <span className={styles.premiumStatusLabel} style={props.labelStyle}>
                            Premium Status:
                        </span>
                        <ul style={{ float: 'left' }}>
                            {productsToShow.map(product => (
                                <li>{getProductListEntry(product)}</li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <p>
                        {' '}
                        <span className={styles.premiumStatusLabel} style={props.labelStyle}>
                            Premium Status:
                        </span>
                        {highestPriorityProduct ? getProductListEntry(highestPriorityProduct) : 'No Premium'}
                    </p>
                )}
            </div>
        </>
    )
}

export default PremiumStatus
