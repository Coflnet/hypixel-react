'use client'
import { useRef, useState } from 'react'
import { Alert, Badge, Button, Spinner } from 'react-bootstrap'
import api from '../../../api/ApiHelper'
import ApiSearchField from '../../Search/ApiSearchField'
import { convertTagToName } from '../../../utils/Formatter'
import { compareItemCategory } from '../../../utils/ItemCategoryUtils'

interface Props {
    selectedCategory?: string
    onCategorySelect(category: string): void
}

interface CheckedItem {
    name: string
    category?: string
}

function ItemCategoryCheck(props: Props) {
    let [isLoading, setIsLoading] = useState(false)
    let [error, setError] = useState<string>()
    let [checkedItem, setCheckedItem] = useState<CheckedItem>()

    // Guards against an older, still-pending lookup overwriting a newer one
    let latestRequestId = useRef(0)

    function reset() {
        latestRequestId.current++
        setIsLoading(false)
        setError(undefined)
        setCheckedItem(undefined)
    }

    function onItemSelected(selected: SearchResultItem[], searchText?: string) {
        if (!selected || selected.length === 0) {
            // Don't clear the previous result just because the user is editing/deleting the search text
            if (searchText) {
                return
            }
            reset()
            return
        }

        let tag = selected[0].id
        let name = selected[0].dataItem.name
        let requestId = ++latestRequestId.current

        setIsLoading(true)
        setError(undefined)

        api.getItemDetails(tag)
            .then(item => {
                if (requestId !== latestRequestId.current) {
                    return
                }
                setCheckedItem({ name: item.name || name, category: item.category })
                setIsLoading(false)
            })
            .catch(() => {
                if (requestId !== latestRequestId.current) {
                    return
                }
                setError(`Could not load the category for ${name}`)
                setCheckedItem(undefined)
                setIsLoading(false)
            })
    }

    function getResultMessage() {
        if (!checkedItem) {
            return null
        }

        let matchState = compareItemCategory(props.selectedCategory, checkedItem.category)
        let actualCategoryName = convertTagToName(checkedItem.category || '')

        if (matchState === 'unknown') {
            return <Alert variant="secondary">Category of {checkedItem.name} is unknown</Alert>
        }

        if (matchState === 'included') {
            return (
                <Alert variant="success">
                    {checkedItem.name} is in {actualCategoryName} and is included by this filter.
                </Alert>
            )
        }

        if (matchState === 'noSelection') {
            return (
                <Alert variant="secondary" className="d-flex align-items-center flex-wrap" style={{ gap: 8 }}>
                    <span>
                        {checkedItem.name} is in <Badge bg="secondary">{actualCategoryName}</Badge>
                    </span>
                    <Button size="sm" variant="outline-primary" onClick={() => props.onCategorySelect(checkedItem!.category!)}>
                        Use {actualCategoryName}
                    </Button>
                </Alert>
            )
        }

        // excluded
        let selectedCategoryName = convertTagToName(props.selectedCategory || '')
        return (
            <Alert variant="warning" className="d-flex align-items-center flex-wrap" style={{ gap: 8 }}>
                <span>
                    {checkedItem.name} is not in <Badge bg="secondary">{selectedCategoryName}</Badge>. It is in{' '}
                    <Badge bg="warning" text="dark">
                        {actualCategoryName}
                    </Badge>
                    .
                </span>
                <Button size="sm" variant="outline-primary" onClick={() => props.onCategorySelect(checkedItem!.category!)}>
                    Switch to {actualCategoryName}
                </Button>
            </Alert>
        )
    }

    return (
        <div style={{ marginTop: 8 }}>
            <ApiSearchField placeholder="Check an item's category..." searchFunction={api.itemSearch} onChange={onItemSelected} multiple={false} />
            {isLoading ? (
                <div style={{ marginTop: 8 }}>
                    <Spinner animation="border" size="sm" role="status" /> <span>Loading item category...</span>
                </div>
            ) : null}
            {error ? (
                <Alert variant="danger" style={{ marginTop: 8 }}>
                    {error}
                </Alert>
            ) : null}
            {!isLoading ? <div style={{ marginTop: 8 }}>{getResultMessage()}</div> : null}
        </div>
    )
}

export default ItemCategoryCheck
