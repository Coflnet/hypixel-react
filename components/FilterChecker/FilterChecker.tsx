'use client'
import React, { useEffect, useState } from 'react'
import { Button } from 'react-bootstrap'
import api from '../../api/ApiHelper'
import { parseAuctionDetails } from '../../utils/Parser/APIResponseParser'
import ItemFilter from '../ItemFilter/ItemFilter'
import { ArrowRightAlt } from '@mui/icons-material'

interface Props {
    auctionToCheck: Parameters<typeof parseAuctionDetails>[0]
}

export function FilterChecker(props: Props) {
    const [filter, setFilter] = useState<ItemFilter>({})
    const [filterOptions, setFilterOptions] = useState<FilterOptions[]>([])
    const [hasFilterApplied, setHasFilterApplied] = useState<boolean | null>(null)
    const [disabled, setDisabled] = useState(true)
    const [isLoading, setIsLoading] = useState(false)
    const [isFilterValid, setIsFilterValid] = useState(true)

    useEffect(() => {
        api.getFilters(props.auctionToCheck.tag).then(setFilterOptions)
    }, [])

    function onFilterChange(newFilter: ItemFilter) {
        const toBeDisabled = !newFilter || Object.keys(newFilter).length === 0
        if (toBeDisabled) {
            setHasFilterApplied(null)
        }
        setDisabled(toBeDisabled)
        setFilter(newFilter)
    }

    function onCheck() {
        setDisabled(true)
        setIsLoading(true)
        api.checkFilter({ ...props.auctionToCheck, bids: [] }, filter)
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
            <ItemFilter
                ignoreURL={true}
                forceOpen={true}
                autoSelect={false}
                onFilterChange={onFilterChange}
                filters={filterOptions}
                onIsValidChange={setIsFilterValid}
            />
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
