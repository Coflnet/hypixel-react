'use client'
import { getHeadMetadata } from '../../utils/SSRUtils'
import { Button } from 'react-bootstrap'
import api from '../../api/ApiHelper'
import { useEffect, useState } from 'react'
import Search from '../Search/Search'
import ItemFilter from '../ItemFilter/ItemFilter'

interface Props {
    onTradeOfferCreated(wantedItem: WantedItem)
}

export default function TradeCreateWantedItem(props: Props) {
    let [selectedItem, setSelectedItem] = useState<Item>()
    let [selectedFilter, setSelectedFilter] = useState<ItemFilter>()
    let [filterOptions, setFilterOptions] = useState<FilterOptions[]>([])

    useEffect(() => {
        loadFilters()
    }, [selectedItem])

    function loadFilters(): Promise<FilterOptions[]> {
        return Promise.all([api.getFilters(selectedItem?.tag || '*'), api.flipFilters(selectedItem?.tag || '*')]).then(filters => {
            let result = [...(filters[0] || []), ...(filters[1] || [])]
            setFilterOptions(result)
            return result
        })
    }

    return (
        <>
            <Search
                onSearchresultClick={result => {
                    setSelectedItem({ tag: result.id, ...result.dataItem })
                }}
                selected={selectedItem}
                hideNavbar
                hideOptions
                searchFunction={api.itemSearch}
            />
            <ItemFilter
                filters={filterOptions}
                disableLastUsedFilter
                ignoreURL
                onFilterChange={filter => {
                    setSelectedFilter(filter)
                }}
            />
            <div style={{ display: 'flex', gap: 15 }}>
                <Button
                    variant="success"
                    onClick={() => {
                        props.onTradeOfferCreated({
                            filters: selectedFilter,
                            itemName: selectedItem?.name || '',
                            tag: selectedItem?.tag || ''
                        })
                    }}
                    disabled={!selectedItem}
                >
                    Create
                </Button>
                <Button variant="danger">Cancel</Button>
            </div>
        </>
    )
}

export const metadata = getHeadMetadata('Trading')
