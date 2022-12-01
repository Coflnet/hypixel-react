import React, { ChangeEvent, useState } from 'react'
import { Button, Form } from 'react-bootstrap'
import api from '../../api/ApiHelper'
import ItemFilter from '../ItemFilter/ItemFilter'

interface Props {
    auctionToCheck: AuctionDetails
}

export function FilterChecker(props: Props) {
    let [filter, setFilter] = useState(null)
    let [hasFilterApplied, setHasFilterApplied] = useState(null)

    function onCheck() {
        api.checkFilter(props.auctionToCheck, filter).then(setHasFilterApplied)
    }

    return (
        <>
            <ItemFilter ignoreURL={true} forceOpen={true} onFilterChange={setFilter} />
            <Button onClick={onCheck}>Check filter</Button>
            {hasFilterApplied !== null ? hasFilterApplied ? <p>Filter applies to this auction</p> : <p>Filter does not apply to this auction</p> : null}
        </>
    )
}
