import React, { ChangeEvent, useEffect, useState } from 'react';
import api from '../../api/ApiHelper';
import { Badge, Form, ListGroup, Spinner } from 'react-bootstrap';
import './Search.css';
import { useHistory } from "react-router-dom";
import { convertTagToName } from '../../utils/Formatter';
import { useMatomo } from '@datapunt/matomo-tracker-react';
import SideNav from 'react-simple-sidenav';
import { Link } from 'react-router-dom';
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
    let [showNav, setShowNav] = useState(false);

    useEffect(() => {
        setSearchText("");
        setResults([]);
        if (props.selected && props.selected.name) {
            document.title = props.selected.name;
        }
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
        <span onClick={() => { setShowNav(true); trackEvent({ category: "informations", action: "open" }) }} className="infoIcon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-three-dots-vertical" viewBox="0 0 16 16">
                <path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" />
            </svg>
        </span>
    );

    let getSelectedElement = (): JSX.Element => {
        if (!props.selected) {
            return <div />
        }
        return <p className="current"><Badge variant="primary">Current:</Badge> <img src={props.selected.iconUrl} width="32" height="32" alt="" style={{ marginRight: "10px" }} />{props.selected.name || convertTagToName((props.selected as Item).tag)}</p>
    }

    let sideNav = (
        <SideNav showNav={showNav}
            titleStyle={{ backgroundColor: "#22A7F0", height: "60px", margin: "auto", padding: "0 20px", lineHeight: "60px" }}
            navStyle={{ width: "60%" }}
            itemStyle={{ padding: "22px 0px", textDecoration: "none" }}
            title={<span>Navigation</span>}
            items={[
                <Link to="/"><span><img src="/Coin.png" height="48" width="48" alt="" />Prices</span></Link>,
                <Link to="/subscriptions"><span><img src="/Coin.png" height="48" width="48" alt="" />Subscriptions</span></Link>,
                <span><img src="/Coin.png" height="48" width="48" alt="" />Premium</span>,
                <Link to="/about"><span><img src="/Coin.png" height="48" width="48" alt="" />Links / Legal</span></Link>]}
            onHideNav={() => { setShowNav(false) }
            }>
        </SideNav >
    );

    return (
        <div className="search">
            {sideNav}
            <Form>
                <Form.Group>
                    {infoElement}
                    <Form.Control type="text" placeholder="Search player/item" className="searchBar" value={searchText} onChange={onSearchChange} onKeyPress={(e: any) => { onKeyPress(e) }} />
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