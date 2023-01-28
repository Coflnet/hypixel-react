/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useEffect, useState } from 'react'
import api from '../../api/ApiHelper'
import { camelCaseToSentenceCase, convertTagToName } from '../../utils/Formatter'
import { useForceUpdate } from '../../utils/Hooks'
import RemoveIcon from '@mui/icons-material/Remove'

interface Props {
    filter?: ItemFilter
    onAfterEdit?(filter: ItemFilter)
}

const DATE_FORMAT_FILTER = ['EndBefore', 'EndAfter']
const SELLER_FORMAT_FILTER = 'Seller'

function ItemFilterPropertiesDisplay(props: Props) {
    let [localFilter, setLocalFilter] = useState(props.filter)

    let forceUpdate = useForceUpdate()

    useEffect(() => {
        updateLocalFilter()
    }, [JSON.stringify(props.filter)])

    function updateLocalFilter() {
        if (!props.filter) {
            return
        }
        let localFilter = JSON.parse(JSON.stringify(props.filter))
        setLocalFilter(localFilter)
        checkForSellerName(localFilter)
    }

    function checkForSellerName(filter: ItemFilter) {
        if (filter) {
            Object.keys(filter).forEach(key => {
                if (key === SELLER_FORMAT_FILTER) {
                    filter!._hide = true
                    api.getPlayerName(filter![key]).then(name => {
                        filter!._hide = false
                        filter!._label = name || '-'
                        setLocalFilter(filter)
                        forceUpdate()
                    })
                }
            })
        }
    }

    function onRemoveClick(key) {
        localFilter[key] = undefined
        props.onAfterEdit(localFilter)
    }

    return (
        <div>
            {!localFilter ? (
                <></>
            ) : (
                Object.keys(localFilter).map(key => {
                    if (!localFilter || localFilter._hide) {
                        return ''
                    }

                    let display = convertTagToName(localFilter[key])

                    if (key.startsWith('_')) {
                        return ''
                    }

                    // Special case -> display as date
                    if (display && DATE_FORMAT_FILTER.findIndex(f => f === key) !== -1) {
                        display = new Date(Number(display) * 1000).toLocaleDateString()
                    }

                    // Special case if the restriction has a special label
                    if (localFilter._sellerName && key === SELLER_FORMAT_FILTER) {
                        display = localFilter._sellerName
                    }

                    if (!localFilter[key] && !display) {
                        display = '-'
                    }

                    return (
                        <p key={key}>
                            {camelCaseToSentenceCase(key)}: {display}
                            {props.onAfterEdit ? (
                                <span
                                    style={{ color: 'red', cursor: 'pointer' }}
                                    onClick={() => {
                                        onRemoveClick(key)
                                    }}
                                >
                                    <RemoveIcon />
                                </span>
                            ) : null}
                        </p>
                    )
                })
            )}
        </div>
    )
}

export default ItemFilterPropertiesDisplay
