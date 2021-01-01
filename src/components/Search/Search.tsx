import React, { ChangeEvent, useEffect, useState } from 'react';
import api from '../../api/ApiHelper';
import { Form, ListGroup, Spinner } from 'react-bootstrap';
import './Search.css';
import { useHistory } from "react-router-dom";

interface Props {
    selected?: Player | Item | string
}

function Search(props: Props) {

    let history = useHistory();

    let [searchText, setSearchText] = useState("");
    let [results, setResults] = useState<SearchResultItem[]>([]);
    let [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout>();
    let [isLoading, setIsLoading] = useState(false);
    let [noResultsFound, setNoResultsFound] = useState(false);

    useEffect(() => {
        setSearchText("");
        setResults([]);
    }, [props.selected])

    function search() {
        // only display loading animation if there is no answer for 500ms
        let sheduledLoading = setTimeout(() => setIsLoading(true), 500);
        let searchFor = searchText;
        api.search(searchFor).then(searchResults => {
            clearTimeout(sheduledLoading);

            // has the searchtext changed?
            if (searchFor === searchText) {
                setNoResultsFound(searchResults.length === 0);
                setResults(searchResults);
                setIsLoading(false);
            }
        });
    }

    function onSearchChange(e: ChangeEvent) {
        let newSearchText: string = (e.target as HTMLInputElement).value;
        searchText = newSearchText;
        setSearchText(newSearchText);
        setNoResultsFound(false);
        if (searchDebounce) {
            clearTimeout(searchDebounce);
        }
        // there is a search response for "", it contains the most popular overall
        if (newSearchText === "") {
            setResults([]);
            setIsLoading(false);
            return;
        }
        let timeout = setTimeout(() => {
            search();
        }, 200);
        setSearchDebounce(timeout);
    }

    function onKeyPress(e: KeyboardEvent) {
        if (!results || e.key !== "Enter") {
            return;
        }
        onItemClick(results[0]);
    }

    function onItemClick(item: SearchResultItem) {
        api.trackSearch(item.id, item.type);
        history.push({
            pathname: item.route
        })
    }

    let noResultsFoundElement = (
        <ListGroup.Item key={-1} style={{ marginBottom: "10px" }}>
            <img className="search-result-icon" width={32} height={32} src="/Barrier.png" alt="" />
            No search results
        </ListGroup.Item>
    );

    let loadingElement = (
        <div style={{ marginLeft: "auto", marginRight: "auto", textAlign: "center" }}>
            <Spinner animation="border" role="status" variant="primary" />
        </div>
    );

    return (
        <div className="search">
            <Form>
                <Form.Group>
                    <Form.Control type="text" placeholder="Search player/item" value={searchText} onChange={onSearchChange} onKeyPress={(e: any) => { onKeyPress(e) }} />
                </Form.Group>
            </Form>
            {
                isLoading ?
                    loadingElement :
                    < ListGroup >
                        {
                            noResultsFound ?
                                noResultsFoundElement :
                                results.map((result, i) => (
                                    <ListGroup.Item key={result.id} action onClick={(e: any) => { onItemClick(result) }} style={i === results.length - 1 ? { marginBottom: "10px" } : {}} >
                                        {result.dataItem.iconUrl ?
                                            <img className="search-result-icon" width={32} height={32} src={result.dataItem.iconUrl} alt="" /> :
                                            <Spinner animation="border" role="status" variant="primary" />
                                        }
                                        {result.dataItem.name}
                                    </ListGroup.Item>
                                ))
                        }
                    </ListGroup>
            }
        </div >
    );
}

export default Search;