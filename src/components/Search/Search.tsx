import React, { ChangeEvent, useEffect, useState } from 'react';
import api from '../../api/ApiHelper';
import { Badge, Form, ListGroup, Spinner } from 'react-bootstrap';
import './Search.css';
import { useHistory } from "react-router-dom";
import { convertTagToName } from '../../utils/Formatter';
import InformationDialog from '../InformationDialog/InformationDialog';
import { useMatomo } from '@datapunt/matomo-tracker-react'

interface Props {
    selected?: Player | Item
}

function Search(props: Props) {

    let history = useHistory();
    let { trackEvent } = useMatomo();

    let [searchText, setSearchText] = useState("");
    let [results, setResults] = useState<SearchResultItem[]>([]);
    let [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout>();
    let [isLoading, setIsLoading] = useState(false);
    let [noResultsFound, setNoResultsFound] = useState(false);
    let [showInformationDialog, setShowInformationDialog] = useState(false);

    useEffect(() => {
        setSearchText("");
        setResults([]);
    }, [props.selected])

    let search = () => {
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

    let onSearchChange = (e: ChangeEvent) => {
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

    let onKeyPress = (e: KeyboardEvent) => {
        if (!results || e.key !== "Enter") {
            return;
        }
        onItemClick(results[0]);
    }

    let onItemClick = (item: SearchResultItem) => {
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

    let infoElement = (
        // eslint-disable-next-line jsx-a11y/anchor-is-valid
        <span onClick={() => { setShowInformationDialog(true); trackEvent({ category: "informations", action: "open" }) }} className="infoIcon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="blue" className="bi bi-info-circle" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                <path d="M8.93 6.588l-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
            </svg>
        </span>
    );

    let getSelectedElement = (): JSX.Element => {
        if (!props.selected) {
            return <div />
        }
        return <p><Badge variant="primary">Current:</Badge> <img src={props.selected.iconUrl} width="32" height="32" alt="" style={{ marginRight: "10px" }} />{props.selected.name || convertTagToName((props.selected as Item).tag)}</p>
    }

    return (
        <div className="search">
            {showInformationDialog ? <InformationDialog onClose={() => setShowInformationDialog(false)} /> : ""}
            <Form>
                <Form.Group>
                    <Form.Control type="text" placeholder="Search player/item" className="searchBar" value={searchText} onChange={onSearchChange} onKeyPress={(e: any) => { onKeyPress(e) }} />
                    {infoElement}
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
            {props.selected ? getSelectedElement() : ""}
        </div >
    );
}

export default Search;