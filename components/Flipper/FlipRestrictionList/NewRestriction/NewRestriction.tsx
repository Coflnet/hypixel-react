import React from 'react'
import { Button, ToggleButton, ToggleButtonGroup } from 'react-bootstrap'
import api from '../../../../api/ApiHelper'
import ItemFilter from '../../../ItemFilter/ItemFilter'
import Search from '../../../Search/Search'
import styles from './NewRestriction.module.css'

interface Props {
    newRestriction: FlipRestriction
    onRestrictionTypeChange(value: 'blacklist' | 'whitelist')
    onSearchResultClick(item: SearchResultItem)
    filters: FilterOptions[]
    onFilterChange(filter?: ItemFilter)
    addNewRestriction()
    onNewRestrictionCancel()
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
                <ToggleButton value={'blacklist'} variant={getButtonVariant('blacklist')} size="sm">
                    Blacklist
                </ToggleButton>
                <ToggleButton value={'whitelist'} variant={getButtonVariant('whitelist')} size="sm">
                    Whitelist
                </ToggleButton>
            </ToggleButtonGroup>
            <div className={styles.newRestrictionSearchbar}>
                <Search
                    selected={props.newRestriction.item}
                    type="item"
                    backgroundColor="#404040"
                    searchFunction={api.itemSearch}
                    onSearchresultClick={props.onSearchResultClick}
                    hideNavbar={true}
                    placeholder="Search item"
                />
            </div>
            <ItemFilter filters={props.filters} forceOpen={true} onFilterChange={props.onFilterChange} ignoreURL={true} autoSelect={false} />
            <span>
                <Button variant="success" onClick={props.addNewRestriction}>
                    Save new restriction
                </Button>
                <Button variant="danger" onClick={props.onNewRestrictionCancel} style={{ marginLeft: '5px' }}>
                    Cancel
                </Button>
            </span>
        </div>
    )
}

export default NewRestriction
