'use client'
import { getPickedItemName, splitSearchResultId } from '../../utils/Search/FilterResultId'
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
    const [selectedItem, setSelectedItem] = useState<Item>()
    const [selectedFilter, setSelectedFilter] = useState<ItemFilter>()
    const [filterOptions, setFilterOptions] = useState<FilterOptions[]>([])

    useEffect(() => {
        loadFilters()
    }, [selectedItem])

    function loadFilters(): Promise<FilterOptions[]> {
        return Promise.all([api.getFilters(selectedItem?.tag || '*'), api.flipFilters(selectedItem?.tag || '*')]).then(filters => {
            const result = [...(filters[0] || []), ...(filters[1] || [])]
            setFilterOptions(result)
            return result
        })
    }

    return (
        <>
            <Search
                onSearchresultClick={result => {
                    setSelectedItem({ ...result.dataItem, tag: splitSearchResultId(result.id).tag, name: getPickedItemName(result, splitSearchResultId(result.id).filter) })
                }}
                placeholder="Search for an item..."
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
