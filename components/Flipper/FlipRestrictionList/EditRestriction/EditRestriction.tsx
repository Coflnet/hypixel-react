import React, { useState } from 'react'
import { Button } from 'react-bootstrap'
import ItemFilter from '../../../ItemFilter/ItemFilter'
import Tooltip from '../../../Tooltip/Tooltip'
import TagSelect from '../TagSelect/TagSelect'

interface Props {
    newRestriction: FlipRestriction
    onSearchResultClick(item: SearchResultItem)
    filters: FilterOptions[]
    onRestrictionChange(restriction?: FlipRestriction)
    addEditedFilter(overrideExisting?: boolean)
    onCancel()
    overrideEditedFilter()
}

function EditRestriction(props: Props) {
    let [isFilterValid, setIsFilterValid] = useState(true)

    return (
        <div>
            <ItemFilter
                defaultFilter={props.newRestriction.itemFilter}
                filters={props.filters}
                forceOpen={true}
                onFilterChange={filter => {
                    let restriction = props.newRestriction
                    restriction.itemFilter = filter
                    props.onRestrictionChange(restriction)
                }}
                ignoreURL={true}
                autoSelect={false}
                disableLastUsedFilter={true}
                onIsValidChange={setIsFilterValid}
            />
            <TagSelect
                restriction={props.newRestriction}
                onTagsChange={tags => {
                    let restriction = props.newRestriction
                    restriction.tags = tags
                    props.onRestrictionChange(restriction)
                }}
            />
            <span>
                <Tooltip
                    type="hover"
                    content={
                        <Button
                            variant="success"
                            onClick={() => {
                                props.addEditedFilter()
                            }}
                            disabled={!isFilterValid}
                        >
                            Add filter(s)
                        </Button>
                    }
                    tooltipContent={
                        <span>
                            Adds all selected filter to the selected restriction(s). If a specific filter is already present, it is <b>not</b> overwritten.
                        </span>
                    }
                />
                <Tooltip
                    type="hover"
                    content={
                        <Button variant="success" onClick={props.overrideEditedFilter} style={{ marginLeft: '20px' }} disabled={!isFilterValid}>
                            Override
                        </Button>
                    }
                    tooltipContent={<span>Overwrites the filter of all the selected restrictions to this.</span>}
                />
                <Button variant="danger" onClick={props.onCancel} style={{ marginLeft: '20px' }}>
                    Cancel
                </Button>
            </span>
        </div>
    )
}

export default EditRestriction
