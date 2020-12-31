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

    useEffect(() => {
        setSearchText("");
        setResults([]);
    }, [props.selected])

    function search(searchText: string) {
        setIsLoading(true);
        isLoading = true;
        api.search(searchText).then(searchResults => {
            if (!isLoading) {
                // Läd nicht mehr -> keine Suche mehr in der zwischenzeit
                return;
            }
            setResults(searchResults);
            setIsLoading(false);
        });
    }

    function onSearchChange(e: ChangeEvent) {
        let newSearchText: string = (e.target as HTMLInputElement).value;
        setSearchText(newSearchText);
        if (searchDebounce) {
            clearTimeout(searchDebounce);
        }
        if (newSearchText === "") {
            setResults([]);
            setIsLoading(false);
            return;
        }
        let timeout = setTimeout(() => {
            search(newSearchText);
        }, 500);
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

    return (
        <div className="search">
            <Form>
                <Form.Group>
                    <Form.Control type="text" placeholder="Search player/item" value={searchText} onChange={onSearchChange} onKeyPress={(e: any) => { onKeyPress(e) }} />
                </Form.Group>
            </Form>
            {
                isLoading ?
                    <div style={{ marginLeft: "auto", marginRight: "auto", textAlign: "center" }}>
                        <Spinner animation="border" role="status" variant="primary" />
                    </div> :
                    <ListGroup>
                        {results.map((result, i) => (
                            <ListGroup.Item key={result.id} action onClick={(e: any) => { onItemClick(result) }} style={i === results.length - 1 ? { marginBottom: "10px" } : {}} >
                                {result.dataItem.iconUrl ?
                                    <img className="search-result-icon" width={32} height={32} src={result.dataItem.iconUrl} alt="" /> :
                                    <Spinner animation="border" role="status" variant="primary" />
                                }
                                {result.dataItem.name}
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
            }
        </div >
    );
}

export default Search;