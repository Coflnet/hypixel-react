import React, { ChangeEvent, useEffect, useState } from 'react';
import api from '../../api/ApiHelper';
import { Form, ListGroup, Spinner } from 'react-bootstrap';
import './Search.css';
import items from '../../items.json';
import { Link } from 'react-router-dom';


interface SearchResultItem {
    dataItem: Player | Item,
    route: string
}

interface Props {
    selected?: Player | Item
}

function Search(props) {

    let [searchText, setSearchText] = useState("");
    let [results, setResults] = useState<SearchResultItem[]>([]);
    let [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout>();
    let [isLoading, setIsLoading] = useState(false);

    function search(searchText: string) {
        let itemResults: SearchResultItem[] = searchItems(searchText);
        if (itemResults.length < 5) {
            searchPlayers(searchText).then(playerResults => {
                onAfterSearch(itemResults, playerResults.slice(0, 5 - itemResults.length))
            })
        } else {
            onAfterSearch(itemResults.slice(0, 5), [])
        }
    }

    function onAfterSearch(itemResults: SearchResultItem[], playerResults: SearchResultItem[]) {
        let results = playerResults.concat(itemResults);;
        setResults(results);
        setIsLoading(false);
        loadAdditionalItemInfo(results, itemResults);
    }

    function loadAdditionalItemInfo(results: SearchResultItem[], itemResults: SearchResultItem[]): void {
        let promises: Promise<Item>[] = [];
        itemResults.forEach(item => {
            promises.push(api.getItemDetails(item.dataItem.name))
        })
        Promise.all(promises).then(itemResults => {
            let resultList = results.slice();
            itemResults.forEach((item, i) => {
                //TODO: nicht mehr per Index suchen
                //let result = resultList.find(r => { return r.dataItem.name === item.name }) || resultLi;
                let result = resultList[i];
                if (result) {
                    let dataItem = result.dataItem as Item;
                    dataItem.category = item.category;
                    dataItem.iconUrl = item.iconUrl;
                    dataItem.tier = item.tier;
                }
            })
            setResults(resultList);
        });
    }

    useEffect(() => {
        setSearchText("");
        setResults([]);
    }, [props.selected])

    function searchItems(searchText: string, maxResults?: number): SearchResultItem[] {
        var matches = items.filter(item => {
            return item.toLowerCase().startsWith(searchText);
        })
        if (maxResults) {
            matches.slice(0, maxResults);
        }
        return matches.map(match => {
            return {
                dataItem: {
                    name: match,
                },
                route: "/item/" + match
            }
        })
    }

    function searchPlayers(searchText: string): Promise<SearchResultItem[]> {
        return new Promise(function (resolve, reject) {
            api.search(searchText).then(players => {
                let results: SearchResultItem[] = players.map(p => {
                    return {
                        dataItem: p,
                        route: "/player/" + p.uuid
                    }
                })
                resolve(results);
            }).catch(error => {
                reject(error);
            });
        });
    }

    function onSearchChange(e: ChangeEvent) {
        let newSearchText: string = (e.target as HTMLInputElement).value;
        setSearchText(newSearchText);
        if (newSearchText === "") {
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