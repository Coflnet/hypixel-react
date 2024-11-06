'use client'
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
    let [highestPriorityProduct, setHighestPriorityProduct] = useState<PremiumProduct>()
    let [productsToShow, setProductsToShow] = useState<PremiumProductWithtimeDifference[]>()

    useEffect(() => {
        let products = props.products.map(product => {
            return {
            ...product,
            timeDifference: 0
            };
        }).sort((a, b) => getPremiumType(b)?.priority - getPremiumType(a)?.priority);

        // Hide lower tier products that are most likely bought automatically together (<1min time difference)
        if (products.length > 1) {
            for (let i = 1; i < products.length; i++) {
                const diff = Math.abs(products[i - 1].expires.getTime() - products[i].expires.getTime());
                if (diff < 60000) {
                    if (getPremiumType(products[i - 1])?.priority > getPremiumType(products[i])?.priority) {
                        products.splice(i, 1)
                    } else {
                        products.splice(i - 1, 1)
                    }
                    i = 0
                } else 
                    products[i].timeDifference = diff
            }
        }
        console.log(products)

        products = products.filter(product => product.expires > new Date())
        setProductsToShow(products)
        setHighestPriorityProduct(getHighestPriorityPremiumProduct(props.products))
    }, [props.products])

    function getProductListEntry(product: PremiumProductWithtimeDifference) {
        return (
            <>
                <span>{getPremiumType(product)?.label}</span>
                <Tooltip
                    type="hover"
                    content={<span> (ends {moment(product.expires).fromNow()}{
                        product.timeDifference > 0 ? (<>, <span className={styles.timeDifference}>{moment.duration(product.timeDifference).humanize()}</span> after</>) : null})</span>}
                    tooltipContent={<span>At {getLocalDateAndTime(product.expires)}</span>}
                />
            </>
        )
    }

    return (
        <>
            <div>
                {productsToShow && productsToShow.length > 1 ? (
                    <div style={{ overflow: 'hidden' }}>
                        <span className={styles.premiumStatusLabel} style={props.labelStyle}>
                            Premium Status:
                        </span>
                        <ul style={{ float: 'left' }}>
                            {productsToShow.map(product => (
                                <li key={product.productSlug}>{getProductListEntry(product)}</li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <p>
                        {' '}
                        <span className={styles.premiumStatusLabel} style={props.labelStyle}>
                            Premium Status:
                        </span>
                        {highestPriorityProduct ? getProductListEntry({...highestPriorityProduct} as PremiumProductWithtimeDifference) : 'No Premium'}
                    </p>
                )}
            </div>
        </>
    )
}

export default PremiumStatus
