import React from 'react'
import { Button, ToggleButton, ToggleButtonGroup } from 'react-bootstrap'
import api from '../../../../api/ApiHelper'
import ItemFilter from '../../../ItemFilter/ItemFilter'
import Search from '../../../Search/Search'
import TagSelect from '../TagSelect/TagSelect'
import styles from './NewRestriction.module.css'

interface Props {
    newRestriction: FlipRestriction
    onRestrictionTypeChange(value: 'blacklist' | 'whitelist')
    onSearchResultClick(item: SearchResultItem)
    filters: FilterOptions[]
    onRestrictionChange(restriction?: FlipRestriction)
    addNewRestriction()
    onCancel()
}

function NewRestriction(props: Props) {
    let getButtonVariant = (range: string): string => {
        return range === props.newRestriction.type ? 'primary' : 'secondary'
    }

    return (
        <div>
            <ToggleButtonGroup
                style={{ maxWidth: '200px', marginBottom: '5px' }}
                type="radio"
                name="options"
                value={props.newRestriction.type}
                onChange={props.onRestrictionTypeChange}
            >
                <ToggleButton id="newRestrictionWhitelistToggleButton" value={'blacklist'} variant={getButtonVariant('blacklist')} size="sm">
                    Blacklist
                </ToggleButton>
                <ToggleButton id="newRestrictionBlacklistToggleButton" value={'whitelist'} variant={getButtonVariant('whitelist')} size="sm">
                    Whitelist
                </ToggleButton>
            </ToggleButtonGroup>
            <div className={styles.newRestrictionSearchbar}>
                <Search
                    selected={props.newRestriction.item}
                    type="item"
                    backgroundColor="#404040"
                    backgroundColorSelected="#222"
                    searchFunction={api.itemSearch}
                    onSearchresultClick={props.onSearchResultClick}
                    hideNavbar={true}
                    placeholder="Search item"
                />
            </div>
            <ItemFilter
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
                <Button variant="success" onClick={props.addNewRestriction}>
                    Save new restriction
                </Button>
                <Button variant="danger" onClick={props.onCancel} style={{ marginLeft: '5px' }}>
                    Cancel
                </Button>
            </span>
        </div>
    )
}

export default NewRestriction
