import React, { ChangeEvent, useEffect, useState } from 'react'
import { Button, Form } from 'react-bootstrap'
import api from '../../api/ApiHelper'
import ItemFilter from '../ItemFilter/ItemFilter'
import { ArrowRightAlt } from '@mui/icons-material'

interface Props {
    auctionToCheck: any
}

export function FilterChecker(props: Props) {
    let [filter, setFilter] = useState(null)
    let [filterOptions, setFilterOptions] = useState<FilterOptions[]>([])
    let [hasFilterApplied, setHasFilterApplied] = useState(null)
    let [disabled, setDisabled] = useState(true)
    let [isLoading, setIsLoading] = useState(false)
    let [isFilterValid, setIsFilterValid] = useState(true)

    useEffect(() => {
        api.getFilters(props.auctionToCheck.tag).then(setFilterOptions)
    }, [])

    function onFilterChange(newFilter: ItemFilter) {
        let toBeDisabled = !newFilter || Object.keys(newFilter).length === 0
        if (toBeDisabled) {
            setHasFilterApplied(null)
        }
        setDisabled(toBeDisabled)
        setFilter(newFilter)
    }

    function onCheck() {
        setDisabled(true)
        setIsLoading(true)
        api.checkFilter(props.auctionToCheck, filter)
            .then(result => {
                setHasFilterApplied(result)
            })
            .finally(() => {
                setIsLoading(false)
                setDisabled(false)
            })
    }

    return (
        <>
            <ItemFilter ignoreURL={true} forceOpen={true} autoSelect={false} onFilterChange={onFilterChange} filters={filterOptions} onIsValidChange={setIsFilterValid} />
            <div>
                <Button onClick={onCheck} disabled={disabled || !isFilterValid} style={{ width: '100%' }}>
                    {!isLoading ? 'Check filter' : 'Loading...'}
                </Button>
                {hasFilterApplied != null ? (
                    <p style={{ color: hasFilterApplied ? 'lime' : 'red', fontSize: 'large', fontWeight: 'bold' }}>
                        <ArrowRightAlt />
                        {hasFilterApplied ? 'Filter applies to this auction' : 'Filter does not apply to this auction'}
                    </p>
                ) : null}
            </div>
        </>
    )
}
