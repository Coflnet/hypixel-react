/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { ChangeEvent, useEffect, useState } from 'react';
import { Badge, Button, Card, Form, Spinner } from 'react-bootstrap';
import './EnchantmentFilter.css';
import { useLocation, useHistory } from "react-router-dom";
import api from '../../api/ApiHelper';
import { getEnchantmentFilterFromUrl } from '../../utils/Parser/URLParser';

interface Props {
    onFilterChange?(filter?: EnchantmentFilter): void,
    disabled?: boolean
}

// Boolean if the component is mounted. Set to false in useEffect cleanup function
let mounted = true;

function EnchantmentFilter(props: Props) {

    let [enchantments, setEnchantments] = useState<Enchantment[]>([]);
    let [enchantmentFilter, setEnchantmentFilter] = useState<EnchantmentFilter>();
    let [expanded, setExpanded] = useState(false);
    let [isApplied, setIsApplied] = useState(false);

    let history = useHistory();
    let query = new URLSearchParams(useLocation().search);

    useEffect(() => {
        mounted = true;
        loadEnchantments();
        enchantmentFilter = getEnchantmentFilterFromUrl(query);
        if (enchantmentFilter) {
            setEnchantmentFilter(enchantmentFilter);
            setExpanded(true);
        }
        return () => { mounted = false }
    }, []);

    history.listen(() => {
        setIsApplied(false);
    })

    let loadEnchantments = () => {
        api.getEnchantments().then(enchantments => {
            if (!mounted) {
                return;
            }
            setEnchantments(enchantments);
            if (!enchantmentFilter) {
                setEnchantmentFilter({
                    enchantment: enchantments[0],
                    level: 1
                })
            }
        })
    }

    let onLevelChange = (newLevel: ChangeEvent) => {
        let newEnchantmentFilter: EnchantmentFilter = {
            enchantment: enchantmentFilter?.enchantment,
            level: parseInt((newLevel.target as HTMLInputElement).value)
        };
        updateURLQuery(newEnchantmentFilter);
        setIsApplied(false);
        setEnchantmentFilter(newEnchantmentFilter);
    }

    let onEnchantmentChange = (newEnchantment: ChangeEvent) => {
        let newEnchantmentFilter: EnchantmentFilter = {
            enchantment: {
                id: parseInt((newEnchantment.target as HTMLOptionElement).value)
            },
            level: enchantmentFilter?.level
        };
        setIsApplied(false);
        updateURLQuery(newEnchantmentFilter);
        setEnchantmentFilter(newEnchantmentFilter);
    }

    let onFilterApply = () => {
        if (props.onFilterChange) {
            props.onFilterChange(enchantmentFilter);
        }
        setIsApplied(true);
    }

    let onFilterRemove = () => {
        setExpanded(false);
        setEnchantmentFilter(undefined);
        if (props.onFilterChange) {
            props.onFilterChange(undefined);
        }
        updateURLQuery();
    }

    let onEnable = () => {
        setExpanded(true);
        if (!enchantmentFilter) {
            enchantmentFilter = {
                enchantment: enchantments[0],
                level: 1
            }
            setEnchantmentFilter(enchantmentFilter);
        }
        updateURLQuery(enchantmentFilter);
    }

    let updateURLQuery = (filter?: EnchantmentFilter) => {
        history.push({
            pathname: history.pathname,
            search: filter ? '?enchantmentFilter=' + btoa(JSON.stringify(filter)) : ''
        })
    }

    let enchantmentSelectList = enchantments.map(enchantment => {
        return (
            <option key={enchantment.id} value={enchantment.id}>{enchantment.name}</option>
        )
    })

    return (
        <div className="enchantment-filter">
            {!expanded ?
                <div>
                    <a href="#" onClick={() => onEnable()}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-plus-circle" viewBox="0 0 16 16">
                            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
                        </svg>
                        <span> Add enchantment filter</span>
                    </a>
                </div> :
                <Card>
                    <Card.Title style={{ margin: "10px" }}>
                        Enchantment Filter
                        {isApplied ?
                            <Badge variant="success" className="appliedBadge">Applied</Badge> :
                            <Badge variant="danger" className="appliedBadge">Not Applied</Badge>}
                    </Card.Title>
                    <Card.Body>
                        <Form inline style={{ marginBottom: "5px" }} >
                            <Form.Group>
                                {enchantments.length > 0 ?
                                    <Form.Control className="enchantment-filter-select-enchantment" as="select" value={enchantmentFilter?.enchantment?.id} onChange={onEnchantmentChange}>
                                        {enchantmentSelectList}
                                    </Form.Control> :
                                    <Spinner animation="border" role="status" variant="primary" />
                                }
                            </Form.Group>
                            <Form.Group>
                                <Form.Control as="select" value={enchantmentFilter?.level} onChange={onLevelChange}>
                                    <option>1</option>
                                    <option>2</option>
                                    <option>3</option>
                                    <option>4</option>
                                    <option>5</option>
                                    <option>6</option>
                                    <option>7</option>
                                    <option>8</option>
                                    <option>9</option>
                                    <option>10</option>
                                </Form.Control>
                            </Form.Group>
                        </Form >
                        <div>
                            <Button className="btn-success" style={{ marginRight: "5px" }} onClick={() => onFilterApply()} disabled={props.disabled}>Apply</Button>
                            <Button className="btn-danger" onClick={() => onFilterRemove()} disabled={props.disabled}>Remove Filter</Button>
                        </div>
                    </Card.Body>
                </Card>
            }
        </div >
    )
}

export default EnchantmentFilter;