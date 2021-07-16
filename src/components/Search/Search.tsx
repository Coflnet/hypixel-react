import React, { ChangeEvent, useEffect, useState } from 'react';
import api from '../../api/ApiHelper';
import { Form, ListGroup, Spinner } from 'react-bootstrap';
import './Search.css';
import { useHistory } from "react-router-dom";
import { convertTagToName } from '../../utils/Formatter';
import NavBar from '../NavBar/NavBar';
import OptionsMenu from '../OptionsMenu/OptionsMenu';

interface Props {
    selected?: Player | Item,
    currentElement?: JSX.Element
}

function Search(props: Props) {

    let history = useHistory();

    let [searchText, setSearchText] = useState("");
    let [results, setResults] = useState<SearchResultItem[]>([]);
    let [isLoading, setIsLoading] = useState(false);
    let [noResultsFound, setNoResultsFound] = useState(false);

    useEffect(() => {
        setSearchText("");
        setResults([]);
    }, [props.selected])

    let search = () => {
        // only display loading animation if there is no answer for 500ms
        let sheduledLoading = setTimeout(() => {
            setIsLoading(true);
        }, 500);
        let searchFor = searchText;
        api.search(searchFor).then(searchResults => {
            clearTimeout(sheduledLoading);

            // has the searchtext changed?
            if (searchFor === (document.getElementById('search-bar') as HTMLInputElement).value) {
                setNoResultsFound(searchResults.length === 0);
                setResults(searchResults);
                setIsLoading(false);
            }
        });
    }

    let onSearchChange = (e: ChangeEvent) => {
        let newSearchText: string = (e.target as HTMLInputElement).value;
        searchText = newSearchText;
        setSearchText(newSearchText);

        if (newSearchText === "") {
            setResults([]);
            setIsLoading(false);
            return;
        }

        setNoResultsFound(false);
        search();
    }

    let onKeyPress = (e: KeyboardEvent) => {
        if (!results || e.key !== "Enter") {
            return;
        }
        onItemClick(results[0]);
    }

    let onItemClick = (item: SearchResultItem) => {
        api.trackSearch(item.id, item.type);
        if (item.getParams && window.location.search !== item.getParams) {
            setSearchText("");
            setResults([]);
        }
        history.push({
            pathname: item.route,
            search: item.getParams
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

    let getSelectedElement = (): JSX.Element => {
        if (!props.selected || props.currentElement) {
            return props.currentElement || <div />;
        }
        return <h1 className="current"><img crossOrigin="anonymous" className="player-head-icon" src={props.selected.iconUrl} width="32" height="32" alt="" style={{ marginRight: "10px" }} loading="lazy" />{props.selected.name || convertTagToName((props.selected as Item).tag)}</h1>
    }

    return (
        <div className="search">

            <Form autoComplete="off">
                <Form.Group>
                    <NavBar />
                    <Form.Control type="text" placeholder="Search player/item" id="search-bar" className="searchBar" value={searchText} onChange={onSearchChange} onKeyPress={(e: any) => { onKeyPress(e) }} />
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
                                            <img className="search-result-icon player-head-icon" crossOrigin="anonymous" width={32} height={32} src={result.dataItem.iconUrl} alt="" loading="lazy" /> :
                                            <Spinner animation="border" role="status" variant="primary" />
                                        }
                                        {result.dataItem.name}
                                    </ListGroup.Item>
                                ))
                        }
                    </ListGroup>
            }
            <div className="bar">
                {getSelectedElement()}
                {isLoading ? "" : <OptionsMenu selected={props.selected} />}
            </div>
        </div >
    );
}

export default Search;