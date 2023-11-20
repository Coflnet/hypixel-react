'use client'
import { getHeadMetadata } from '../../utils/SSRUtils'
import { Card, Container } from 'react-bootstrap'
import api from '../../api/ApiHelper'
import { useEffect, useState } from 'react'
import { convertTagToName, getMinecraftColorCodedElement } from '../../utils/Formatter'
import ItemFilterPropertiesDisplay from '../ItemFilter/ItemFilterPropertiesDisplay'
import ItemFilter from '../ItemFilter/ItemFilter'
import DeleteIcon from '@mui/icons-material/Delete'

interface Props {
    currentUserUUID?: string
}

export default function TradeList(props: Props) {
    let [trades, setTrades] = useState<TradeObject[]>([])
    let [filterOptions, setFilterOptions] = useState<FilterOptions[]>([])
    let [filter, setFilter] = useState<ItemFilter>()

    useEffect(() => {
        loadTrades(filter)
        loadFilters()
    }, [])

    function onFilterChange(newFilter: ItemFilter) {
        setFilter({ ...newFilter })
        loadTrades(newFilter)
    }

    function loadFilters(): Promise<FilterOptions[]> {
        return Promise.all([api.getFilters('*'), api.flipFilters('*')]).then(filters => {
            let result = [...(filters[0] || []), ...(filters[1] || [])]
            setFilterOptions(result)
            return result
        })
    }

    function loadTrades(filter?: ItemFilter) {
        api.getTradeOffers(filter).then(newTrades => {
            setTrades(newTrades)
        })
    }

    function deleteTrade(tradeId: string) {
        api.deleteTradeOffer(tradeId).then(() => {
            let newTrades = [...trades]
            setTrades(newTrades.filter(trade => trade.id !== tradeId))
        })
    }

    return (
        <>
            <Container>
                <ItemFilter onFilterChange={onFilterChange} filters={filterOptions} ignoreURL disableLastUsedFilter />
                {trades.map(trade => (
                    <Card key={trade.id} style={{ marginBottom: '15px' }}>
                        <Card.Header>
                            <Card.Title>
                                <img
                                    title={trade.playerName}
                                    src={'https://crafatar.com/avatars/' + trade.playerUuid + '?size=8'}
                                    alt=""
                                    crossOrigin="anonymous"
                                    height={24}
                                />
                                {trade.playerName}
                                {props.currentUserUUID && trade.playerUuid === props.currentUserUUID ? (
                                    <DeleteIcon
                                        onClick={() => {
                                            deleteTrade(trade.id)
                                        }}
                                        style={{ float: 'right', color: 'red', cursor: 'pointer' }}
                                    />
                                ) : null}
                            </Card.Title>
                        </Card.Header>
                        <Card.Body>
                            <div style={{ display: 'flex', justifyContent: 'space-evenly' }}>
                                <div style={{ width: '40%' }}>
                                    <h2>Has</h2>
                                    <Card>
                                        <Card.Header>
                                            <Card.Title>
                                                <img
                                                    title={convertTagToName(trade.item.tag)}
                                                    src={api.getItemImageUrl(trade.item)}
                                                    alt=""
                                                    crossOrigin="anonymous"
                                                    height={24}
                                                />
                                                {getMinecraftColorCodedElement(`${trade.item.itemName}`)}
                                            </Card.Title>
                                        </Card.Header>
                                        <Card.Body>{getMinecraftColorCodedElement(trade.item.description, false)}</Card.Body>
                                    </Card>
                                </div>
                                <div style={{ width: '40%' }}>
                                    <h2>Want</h2>
                                    {trade.wantedItems.map((wantedItem, i) => {
                                        return (
                                            <Card style={{ marginBottom: '10px' }}>
                                                <Card.Header>
                                                    <img
                                                        title={convertTagToName(wantedItem.itemName)}
                                                        src={api.getItemImageUrl(wantedItem)}
                                                        alt=""
                                                        crossOrigin="anonymous"
                                                        height={24}
                                                    />
                                                    {wantedItem.itemName}
                                                </Card.Header>
                                                {wantedItem.filters ? (
                                                    <Card.Body>
                                                        <ItemFilterPropertiesDisplay filter={wantedItem.filters} />
                                                    </Card.Body>
                                                ) : null}
                                            </Card>
                                        )
                                    })}
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                ))}
            </Container>
        </>
    )
}

export const metadata = getHeadMetadata('Trading')
