/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useEffect, useState } from 'react'
import api from '../../api/ApiHelper'
import { camelCaseToSentenceCase, convertTagToName } from '../../utils/Formatter'
import { useForceUpdate } from '../../utils/Hooks'
import ItemFilter from './ItemFilter'

interface Props {
    filter?: ItemFilter
}

const DATE_FORMAT_FILTER = ['EndBefore', 'EndAfter']
const SELLER_FORMAT_FILTER = 'Seller'

function ItemFilterPropertiesDisplay(props: Props) {
    let [localFilter, setLocalFilter] = useState(props.filter)

    let forceUpdate = useForceUpdate();

    useEffect(() => {
        if(!props.filter){
            return;
        }
        let localFilter = JSON.parse(JSON.stringify(props.filter));
        setLocalFilter(localFilter)
        checkForSellerName(localFilter)
    }, [props.filter])

    function checkForSellerName(filter: ItemFilter) {
        if (filter) {
            Object.keys(filter).forEach(key => {
                if (key === SELLER_FORMAT_FILTER) {
                    filter!._hide = true
                    api.getPlayerName(filter![key]).then(name => {
                        filter!._hide = false
                        filter!._label = name
                        setLocalFilter(filter);
                        forceUpdate();
                    })
                }
            })
        }
    }

    return (
        <div>
            {!localFilter ? (
                <></>
            ) : (
                Object.keys(localFilter).map(key => {
                    if (!localFilter || !localFilter[key] || localFilter._hide) {
                        return ''
                    }

                    let display = convertTagToName(localFilter[key])

                    if (key.startsWith('_')) {
                        return ''
                    }

                    // Special case -> display as date
                    if (DATE_FORMAT_FILTER.findIndex(f => f === key) !== -1) {
                        display = new Date(Number(display) * 1000).toLocaleDateString()
                    }

                    // Special case if the restriction has a special label
                    if (localFilter._label) {
                        display = localFilter._label
                    }

                    return (
                        <p key={key}>
                            {camelCaseToSentenceCase(key)}: {display}
                        </p>
                    )
                })
            )}
        </div>
    )
}

export default ItemFilterPropertiesDisplay
