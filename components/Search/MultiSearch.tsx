import { forwardRef, Ref, useState } from 'react'
import { AsyncTypeahead, Highlighter } from 'react-bootstrap-typeahead'
import { v4 as generateUUID } from 'uuid'
import Typeahead from 'react-bootstrap-typeahead/types/core/Typeahead'
import api from '../../api/ApiHelper'
import { Option } from 'react-bootstrap-typeahead/types/types'
import styles from './Search.module.css'
import Image from 'next/image'
interface Props {
    onChange(selected: SearchResultItem[])
    disabled?: boolean
    placeholder?: string
    defaultValue?: string
    searchFunction?(searchText: string): Promise<SearchResultItem[]>
}

export let MultiSearch = forwardRef((props: Props, ref: Ref<Typeahead>) => {
    let [uuid] = useState(generateUUID())
    let [results, setResults] = useState<SearchResultItem[]>([])
    let [isLoading, setIsLoading] = useState(false)

    function _onChange(selected: Option[]) {
        props.onChange(selected as SearchResultItem[])
    }

    function handleSearch(query) {
        setIsLoading(true)

        let searchFunction = props.searchFunction || api.search

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
            className={styles.multiSearch}
            disabled={props.disabled}
            inputProps={{ className: styles.multiInputfield }}
            filterBy={() => true}
            isLoading={isLoading}
            labelKey="label"
            renderMenuItemChildren={(option, { text }) => {
                let o: any = option
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
                        <Highlighter search={text}>{o.label}</Highlighter>
                    </>
                )
            }}
            minLength={1}
            onSearch={handleSearch}
            defaultInputValue={props.defaultValue}
            options={results}
            placeholder={props.placeholder || 'Search item...'}
            onChange={_onChange}
            ref={ref}
            multiple={true}
        />
    )
})
