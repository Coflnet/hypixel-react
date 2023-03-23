import React, { ChangeEvent, useEffect, useState } from 'react'
import { Button, Form } from 'react-bootstrap'
import api from '../../api/ApiHelper'
import ItemFilter from '../ItemFilter/ItemFilter'

interface Props {
    auctionToCheck: AuctionDetails
}

export function FilterChecker(props: Props) {
    let [filter, setFilter] = useState(null)
    let [filterOptions, setFilterOptions] = useState<FilterOptions[]>([])
    let [hasFilterApplied, setHasFilterApplied] = useState(null)

    useEffect(() => {
        Promise.all([api.getFilters(props.auctionToCheck.auction.item.tag), api.flipFilters(props.auctionToCheck.auction.item.tag)]).then(results => {
            setFilterOptions([...results[0], ...results[1]])
        })
    }, [])

    function onCheck() {
        api.checkFilter(props.auctionToCheck, filter).then(setHasFilterApplied)
    }

    return (
        <>
            <ItemFilter ignoreURL={true} forceOpen={true} onFilterChange={setFilter} filters={filterOptions} />
            <Button onClick={onCheck} disabled={!filter || Object.keys(filter).length === 0}>
                Check filter
            </Button>
            {hasFilterApplied !== null ? hasFilterApplied ? <p>Filter applies to this auction</p> : <p>Filter does not apply to this auction</p> : null}
        </>
    )
}
