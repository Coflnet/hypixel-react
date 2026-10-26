'use client'
import Image from 'next/image'
import { useRef, useState } from 'react'
import { AsyncTypeahead } from 'react-bootstrap-typeahead'
import Typeahead from 'react-bootstrap-typeahead/types/core/Typeahead'
import { Option } from 'react-bootstrap-typeahead/types/types'
import { v4 as generateUUID } from 'uuid'
import api from '../../api/ApiHelper'
import { getStyleForTier } from '../../utils/Formatter'
import styles from './Search.module.css'

interface Props {
    onChange(selected: SearchResultItem[], searchText?: string)
    disabled?: boolean
    placeholder?: string
    defaultValue?: string
    searchFunction?(searchText: string): Promise<SearchResultItem[]>
    selected?: SearchResultItem[]
    defaultSelected?: SearchResultItem[]
    className?: string
    multiple: boolean
}

export default (props: Props) => {
    const [uuid] = useState(generateUUID())
    const [results, setResults] = useState<SearchResultItem[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const ref = useRef<Typeahead>(null)

    function _onChange(selected: Option[]) {
        props.onChange(selected as SearchResultItem[], ref?.current?.getInput()?.value)
    }

    function handleSearch(query) {
        setIsLoading(true)

        const searchFunction = props.searchFunction || api.search

        searchFunction(query).then(results => {
            setResults(
                results.map(r => {
                    return {
                        label: r.dataItem.name || '-',
                        ...r
                    }
                })
            )
            setIsLoading(false)
        })
    }

    return (
        <AsyncTypeahead
            id={uuid}
            className={`${styles.multiSearch} ${props.className}`}
            disabled={props.disabled}
            inputProps={{ className: styles.multiInputfield }}
            filterBy={() => true}
            isLoading={isLoading}
            key={uuid}
            labelKey="label"
            renderMenuItemChildren={option => {
                const o = option as SearchResultItem & { label: string }
                const isDuplicate = results.filter(element => element.dataItem.name === o.dataItem.name).length > 1
                return (
                    <>
                        <Image
                            className={`${styles.searchResultIcon} playerHeadIcon`}
                            crossOrigin="anonymous"
                            width={32}
                            height={32}
                            src={o.dataItem.iconUrl}
                            alt=""
                        />
                        <span style={isDuplicate ? getStyleForTier(o.tier) : undefined}>{o.label}</span>
                    </>
                )
            }}
            defaultSelected={props.defaultSelected}
            minLength={1}
            onSearch={handleSearch}
            defaultInputValue={props.defaultValue}
            selected={props.selected}
            options={results}
            placeholder={props.placeholder || 'Search item...'}
            onChange={_onChange}
            ref={ref}
            multiple={props.multiple}
        />
    )
}
