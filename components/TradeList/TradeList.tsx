'use client'
import { getHeadMetadata } from '../../utils/SSRUtils'
import { Card, Container, Form } from 'react-bootstrap'
import api from '../../api/ApiHelper'
import { useEffect, useState } from 'react'
import { convertTagToName, getMinecraftColorCodedElement, removeMinecraftColorCoding } from '../../utils/Formatter'
import ItemFilterPropertiesDisplay from '../ItemFilter/ItemFilterPropertiesDisplay'
import ItemFilter from '../ItemFilter/ItemFilter'
import DeleteIcon from '@mui/icons-material/Delete'
import { getLoadingElement } from '../../utils/LoadingUtils'
import { CopyButton } from '../CopyButton/CopyButton'

interface Props {
    currentUserUUID?: string
}

export default function TradeList(props: Props) {
    let [trades, setTrades] = useState<TradeObject[]>([])
    let [filterOptions, setFilterOptions] = useState<FilterOptions[]>([])
    let [filter, setFilter] = useState<ItemFilter>()
    let [onlyOwnTrades, setOnlyOwnTrades] = useState(false)
    let [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        loadTrades(onlyOwnTrades, filter)
        loadFilters()
    }, [])

    function onFilterChange(newFilter: ItemFilter) {
        setFilter({ ...newFilter })
        loadTrades(onlyOwnTrades, newFilter)
    }

    function loadFilters(): Promise<FilterOptions[]> {
        return Promise.all([api.getFilters('*'), api.flipFilters('*')]).then(filters => {
            let result = [...(filters[0] || []), ...(filters[1] || [])]
            setFilterOptions(result)
            return result
        })
    }

    function loadTrades(onlyOwn: boolean, filter?: ItemFilter) {
        setIsLoading(true)
        api.getTradeOffers(onlyOwn, filter).then(newTrades => {
            setTrades(newTrades)
            setIsLoading(false)
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
                <div style={{ display: 'flex' }}>
                    <Form.Check
                        id="onlyOwnTradesCheckbox"
                        defaultChecked={onlyOwnTrades}
                        onChange={check => {
                            setOnlyOwnTrades(check.target.checked)
                            loadTrades(check.target.checked, filter)
                        }}
                    />
                    <Form.Label htmlFor="onlyOwnTradesCheckbox" style={{ marginLeft: '5px' }}>
                        Show only own trades
                    </Form.Label>
                </div>
                <ItemFilter onFilterChange={onFilterChange} filters={filterOptions} ignoreURL disableLastUsedFilter />
                {isLoading
                    ? getLoadingElement()
                    : trades.map(trade => (
                          <Card key={trade.id} style={{ marginBottom: '15px' }}>
                              <Card.Header>
                                  <Card.Title>
                                      <img
                                          title={trade.playerName}
                                          src={'https://crafatar.com/avatars/' + trade.playerUuid + '?size=8'}
                                          alt=""
                                          style={{ marginRight: 10 }}
                                          crossOrigin="anonymous"
                                          height={24}
                                      />
                                      {trade.playerName}
                                      <CopyButton
                                          buttonStyle={{ marginLeft: '30px' }}
                                          buttonVariant="primary"
                                          buttonContent={<span style={{ marginLeft: 5 }}>Copy party command</span>}
                                          copyValue={`/p ${trade.playerName}`}
                                          successMessage={<span>Copied party command</span>}
                                      />
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
                                                      {trade.item.count !== 1 ? `${trade.item.count}x` : null}{' '}
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
