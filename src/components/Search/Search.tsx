import React, { ChangeEvent, useEffect, useState } from 'react';
import api from '../../api/ApiHelper';
import { Form, InputGroup, ListGroup, Spinner } from 'react-bootstrap';
import './Search.css';
import { useHistory } from "react-router-dom";
import { convertTagToName } from '../../utils/Formatter';
import NavBar from '../NavBar/NavBar';
import OptionsMenu from '../OptionsMenu/OptionsMenu';
import { SearchOutlined as SearchIcon } from '@material-ui/icons'

interface Props {
    selected?: Player | Item,
    currentElement?: JSX.Element
    backgroundColor?: string,
    searchFunction?(searchText: string),
    onSearchresultClick?(item: SearchResultItem),
    hideNavbar?: boolean,
    placeholder?: string
}

function Search(props: Props) {

    let history = useHistory();

    let [searchText, setSearchText] = useState("");
    let [results, setResults] = useState<SearchResultItem[]>([]);
    let [isLoading, setIsLoading] = useState(false);
    let [noResultsFound, setNoResultsFound] = useState(false);

    let isSmall = document.body.clientWidth < 1500;

    useEffect(() => {
        setSearchText("");
        setResults([]);
    }, [props.selected])

    let search = () => {

        let searchFor = searchText;
        let searchFunction = props.searchFunction || api.search;
        searchFunction(searchFor).then(searchResults => {

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
        if (item.getParams && window.location.search !== item.getParams) {
            setSearchText("");
            setResults([]);
        }
        if (props.onSearchresultClick) {
            props.onSearchresultClick(item);
            return;
        }
        api.trackSearch(item.id, item.type);
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

    let getSelectedElement = (): JSX.Element => {
        if (!props.selected || props.currentElement) {
            return props.currentElement || <div />;
        }
        return <h1 className="current"><img crossOrigin="anonymous" className="player-head-icon" src={props.selected.iconUrl} width="32" height="32" alt="" style={{ marginRight: "10px" }} loading="lazy" />{props.selected.name || convertTagToName((props.selected as Item).tag)}</h1>
    }

    let searchStyle: React.CSSProperties = {
        backgroundColor: props.backgroundColor,
        borderRadius: results.length > 0 ? "0px 10px 0 0" : "0px 10px 10px 0px",
        borderLeftWidth: 0,
        borderBottomColor: results.length > 0 ? "#444" : undefined
    }
    let searchIconStyle: React.CSSProperties = {
        width: isSmall ? "auto" : "58px",
        borderRadius: results.length > 0 ? "10px 0 0 0" : "10px 0px 0px 10px",
        backgroundColor: props.backgroundColor || "#303030",
        borderBottomColor: results.length > 0 ? "#444" : undefined,
        padding: isSmall ? "0px" : undefined
    }

    function getListItemStyle(i: number): React.CSSProperties {
        return {
            backgroundColor: props.backgroundColor,
            borderRadius: i === results.length - 1 ? "0 0 10px 10px" : "",
            border: 0,
            borderTop: i === 0 ? "1px solid #444" : 0,
            borderTopWidth: i === 0 ? 0 : undefined
        }
    };

    let listWidth = document.getElementById('search-input-group')?.offsetWidth ? document.getElementById('search-input-group')!.offsetWidth - 2 : "";

    return (
        <div className="search" style={isSmall ? { marginLeft: "-5px", marginRight: "-5px" } : {}}>

            <Form autoComplete="off">
                <Form.Group className="search-form-group">
                    {!isSmall && !props.hideNavbar ? <NavBar /> : ""}
                    <InputGroup id="search-input-group">
                        <InputGroup.Text style={searchIconStyle}>
                            {isSmall && !props.hideNavbar ? <div style={{ width: "56px" }}><NavBar hamburgerIconStyle={{ marginRight: "0px", width: "56px" }} /></div> :
                                <SearchIcon />
                            }
                        </InputGroup.Text>
                        <Form.Control style={searchStyle} type="text" placeholder={props.placeholder || "Search player/item"} id="search-bar" className="searchBar" value={searchText} onChange={onSearchChange} onKeyPress={(e: any) => { onKeyPress(e) }} />
                    </InputGroup>
                </Form.Group>
            </Form>
            <ListGroup style={{ width: listWidth, marginLeft: isSmall ? "1px" : "1px", borderTopWidth: 0 }}>
                {
                    noResultsFound ?
                        noResultsFoundElement :
                        results.map((result, i) => (
                            <ListGroup.Item key={result.id} action onClick={(e: any) => { onItemClick(result) }} style={getListItemStyle(i)} >
                                {result.dataItem.iconUrl ?
                                    <img className="search-result-icon player-head-icon" crossOrigin="anonymous" width={32} height={32} src={result.dataItem.iconUrl} alt="" loading="lazy" /> :
                                    <Spinner animation="border" role="status" variant="primary" />
                                }
                                {result.dataItem.name}
                            </ListGroup.Item>
                        ))
                }
            </ListGroup>
            <div className="bar" style={{ marginTop: "20px" }}>
                {getSelectedElement()}
                {isLoading ? "" : <OptionsMenu selected={props.selected} />}
            </div>
        </div >
    );
}

export default Search;