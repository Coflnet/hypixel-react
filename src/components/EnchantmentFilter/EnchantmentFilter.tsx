import React, { ChangeEvent, useEffect, useState } from 'react';
import { Form, Spinner } from 'react-bootstrap';
import './EnchantmentFilter.css';
import { useLocation, useHistory } from "react-router-dom";
import { parseEnchantmentFilter } from '../../utils/Parser/URLParser';
import api from '../../api/ApiHelper';

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

interface Props {
    onFilterChange?(filter: EnchantmentFilter): void
}

function EnchantmentFilter(props: Props) {

    let [enchantments, setEnchantments] = useState<Enchantment[]>([]);
    let [enchantmentFilter, setEnchantmentFilter] = useState<EnchantmentFilter>();
    let query = useQuery();
    let history = useHistory();

    useEffect(() => {
        loadEnchantments();
        setEnchantmentFilter(getFilterFromUrl());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    let loadEnchantments = () => {
        api.getEnchantments().then(enchantments => {
            setEnchantments(enchantments);
        })
    }

    let onLevelChange = (newLevel: ChangeEvent) => {
        let newEnchantmentFilter: EnchantmentFilter = {
            enchantment: enchantmentFilter?.enchantment,
            level: parseInt((newLevel.target as HTMLInputElement).value)
        };
        updateURLQuery(newEnchantmentFilter);
        setEnchantmentFilter(newEnchantmentFilter);
        if (props.onFilterChange) {
            props.onFilterChange(newEnchantmentFilter);
        }
    }

    let onEnchantmentChange = (newEnchantment: ChangeEvent) => {
        let newEnchantmentFilter: EnchantmentFilter = {
            enchantment: {
                id: parseInt((newEnchantment.target as HTMLOptionElement).value)
            },
            level: enchantmentFilter?.level
        };
        updateURLQuery(newEnchantmentFilter);
        setEnchantmentFilter(newEnchantmentFilter);

        if (props.onFilterChange) {
            props.onFilterChange(newEnchantmentFilter);
        }
    }

    let updateURLQuery = (filter: EnchantmentFilter) => {
        history.push({
            pathname: history.pathname,
            search: '?enchantmentFilter=' + btoa(JSON.stringify(filter))
        })
    }

    let getFilterFromUrl = (): EnchantmentFilter | undefined => {
        let enchantmentFilterBase64 = query.get("enchantmentFilter")
        if (enchantmentFilterBase64) {
            return parseEnchantmentFilter(enchantmentFilterBase64);
        }
    }

    let enchantmentSelectList = enchantments.map(enchantment => {
        return (
            <option key={enchantment.id} value={enchantment.id}>{enchantment.name}</option>
        )
    })

    return (
        <Form inline className="enchantment-filter">
            <Form.Group>
                <Form.Label className="enchantment-filter-label">Enchantment: </Form.Label>
                {enchantments.length > 0 ?
                    <Form.Control as="select" value={enchantmentFilter?.enchantment?.id} onChange={onEnchantmentChange}>
                        {enchantmentSelectList}
                    </Form.Control> :
                    <Spinner animation="border" role="status" variant="primary" />
                }
            </Form.Group>
            <Form.Group className="enchantment-filter-select-level">
                <Form.Label className="enchantment-filter-label">Level: </Form.Label>
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
        </Form>
    )
}

export default EnchantmentFilter;