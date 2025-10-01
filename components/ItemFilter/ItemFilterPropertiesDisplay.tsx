'use client'
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable jsx-a11y/anchor-is-valid */
import RemoveIcon from '@mui/icons-material/Remove'
import { useEffect, useState } from 'react'
import api from '../../api/ApiHelper'
import { camelCaseToSentenceCase, convertTagToName, numberWithThousandsSeparators } from '../../utils/Formatter'
import { useForceUpdate } from '../../utils/Hooks'
import Tooltip from '../Tooltip/Tooltip'
import HelpIcon from '@mui/icons-material/Help'

interface Props {
    filter?: ItemFilter
    onAfterEdit?(filter: ItemFilter)
    isEditable?: boolean
}

const DATE_FORMAT_FILTER = ['EndBefore', 'EndAfter', 'ItemCreatedBefore', 'ItemCreatedAfter']
const SELLER_FORMAT_FILTER = 'Seller'
const SKIN_FILTER = 'Skin'
const PET_SKIN_FILTER = 'PetSkin'

function ItemFilterPropertiesDisplay(props: Props) {
    let [localFilter, setLocalFilter] = useState(props.filter || {})

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
        let newLocalFilter = { ...localFilter }
        delete newLocalFilter[key]
        setLocalFilter(newLocalFilter)
        if (props.onAfterEdit) {
            props.onAfterEdit(newLocalFilter)
        }
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
                    let info: string | null = null

                    if (key === 'ItemNameContains') {
                        display = localFilter[key]
                    }

                    if (key.startsWith('_')) {
                        return ''
                    }

                    // finds ">","<","="" and combinations at the beginning
                    let beginningSymbolRegexp = new RegExp(/^[<>=]+/)
                    if (!isNaN(Number(display.replace(beginningSymbolRegexp, '')))) {
                        let symbols = display.match(beginningSymbolRegexp)
                        let number = display.replace(beginningSymbolRegexp, '')
                        display = numberWithThousandsSeparators(Number(number))
                        display = symbols ? symbols[0] + display : display
                    }

                    // finds number ranges (e.g. "10000-999999")
                    let numberRangeRegex = new RegExp(/^\d+-\d+$/)
                    if (display.match(numberRangeRegex)) {
                        let numbers = display.split('-').map(numberString => numberWithThousandsSeparators(Number(numberString)))

                        if (numbers[0] === numbers[1]) {
                            display = numbers[0].toString()
                        } else {
                            display = numbers.join('-')
                        }
                    }

                    // Special case -> display as date
                    if (localFilter[key] && DATE_FORMAT_FILTER.findIndex(f => f === key) !== -1) {
                        display = new Date(Number(localFilter[key]) * 1000).toLocaleDateString()
                    }

                    // Special case if the restriction has a special label
                    if (localFilter._sellerName && key === SELLER_FORMAT_FILTER) {
                        display = localFilter._sellerName
                    }

                    // Special case for skin filter
                    if (key === SKIN_FILTER || key === PET_SKIN_FILTER) {
                        info = 'This filter only works on applied skins on pets/armor. For the items there is the "ItemCategory" filter.'
                    }

                    if (!localFilter[key] && !display) {
                        display = '-'
                    }

                    return (
                        <span key={key}>
                            <div className="ellipse mb-2" title={display}>
                                {camelCaseToSentenceCase(key)}: {display}
                                {info ? (
                                    <Tooltip
                                        type="hover"
                                        content={<HelpIcon style={{ color: '#007bff', cursor: 'pointer', marginLeft: 5 }} />}
                                        tooltipContent={<span>{info}</span>}
                                    />
                                ) : null}
                            </div>

                            {props.isEditable ? (
                                <span
                                    style={{ color: 'red', cursor: 'pointer' }}
                                    onClick={() => {
                                        onRemoveClick(key)
                                    }}
                                >
                                    <RemoveIcon />
                                </span>
                            ) : null}
                        </span>
                    )
                })
            )}
        </div>
    )
}

export default ItemFilterPropertiesDisplay
