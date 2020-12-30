import React, { ChangeEvent, useEffect, useState } from 'react';
import api from '../../api/ApiHelper';
import { Form, ListGroup, Spinner } from 'react-bootstrap';
import './Search.css';
import { Link } from 'react-router-dom';

interface Props {
    selected?: Player | Item | string
}

function Search(props: Props) {

    let [searchText, setSearchText] = useState("");
    let [results, setResults] = useState<SearchResultItem[]>([]);
    let [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout>();
    let [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setSearchText("");
        setResults([]);
    }, [props.selected])

    function search(searchText: string) {
        api.search(searchText).then(searchResults => {
            if(!isLoading){
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
        if (newSearchText === "") {
            setResults([]);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        if (searchDebounce) {
            clearTimeout(searchDebounce);
        }
        let timeout = setTimeout(() => {
            search(newSearchText);
        }, 500);
        setSearchDebounce(timeout);
    }

    return (
        <div className="search">
            <Form>
                <Form.Group>
                    <Form.Control type="text" placeholder="Search player/item" value={searchText} onChange={onSearchChange} />
                </Form.Group>
            </Form>
            {
                isLoading ?
                    <Spinner animation="border" role="status" variant="primary" /> :
                    <ListGroup>
                        {results.map((result, i) => (
                            <Link to={result.route} key={result.dataItem.name}>
                                <ListGroup.Item action>
                                    {result.dataItem.iconUrl ?
                                        <img className="search-result-icon" width={64} height={64} src={result.dataItem.iconUrl} alt="" /> :
                                        <Spinner animation="border" role="status" variant="primary" />
                                    }
                                    {result.dataItem.name}
                                </ListGroup.Item>
                            </Link>
                        ))}
                    </ListGroup>
            }
        </div >
    );
}

export default Search;