import React from 'react'
import { Button } from 'react-bootstrap'
import ItemFilter from '../../../ItemFilter/ItemFilter'
import Tooltip from '../../../Tooltip/Tooltip'

interface Props {
    newRestriction: FlipRestriction
    onSearchResultClick(item: SearchResultItem)
    filters: FilterOptions[]
    onFilterChange(filter?: ItemFilter)
    addEditedFilter(overrideExisting?: boolean)
    onNewRestrictionCancel()
    overrideEditedFilter()
}

function EditRestriction(props: Props) {
    let getButtonVariant = (range: string): string => {
        return range === props.newRestriction.type ? 'primary' : 'secondary'
    }

    return (
        <div>
            <ItemFilter
                defaultFilter={props.newRestriction.itemFilter}
                filters={props.filters}
                forceOpen={true}
                onFilterChange={props.onFilterChange}
                ignoreURL={true}
                autoSelect={false}
            />
            <span>
                <Tooltip
                    type="hover"
                    content={
                        <Button
                            variant="success"
                            onClick={() => {
                                props.addEditedFilter(false)
                            }}
                        >
                            Add
                        </Button>
                    }
                    tooltipContent={
                        <span>
                            Adds the filter to the selected restriction(s). If a specific filter is already present, it is <b>not</b> overwritten.
                        </span>
                    }
                />
                <Tooltip
                    type="hover"
                    content={
                        <Button
                            variant="success"
                            onClick={() => {
                                props.addEditedFilter(true)
                            }}
                            style={{ marginLeft: '20px' }}
                        >
                            Add (override existing)
                        </Button>
                    }
                    tooltipContent={
                        <span>
                            Adds the filter to the selected restriction(s). If a specific filter is already present, it <b>is overwritten</b>.
                        </span>
                    }
                />
                <Tooltip
                    type="hover"
                    content={
                        <Button variant="success" onClick={props.overrideEditedFilter} style={{ marginLeft: '20px' }}>
                            Override
                        </Button>
                    }
                    tooltipContent={<span>Overwrites the entire filter of all the selected restrictions.</span>}
                />
            </span>
        </div>
    )
}

export default EditRestriction
