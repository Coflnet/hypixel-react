'use client'
import ArrowDownIcon from '@mui/icons-material/ArrowDownward'
import ArrowUpIcon from '@mui/icons-material/ArrowUpward'
import SortIcon from '@mui/icons-material/Sort'
import { useState, type ChangeEvent } from 'react'
import { Card, Form, Table } from 'react-bootstrap'
import { getLoadingElement } from '../../utils/LoadingUtils'
import { NumericFormat } from 'react-number-format'
import styles from './LowSupplyList.module.css'
import Image from 'next/image'
import Number from '../Number/Number'

interface Props {
    lowSupplyItems?: LowSupplyItem[]
}

function LowSupplyList(props: Props) {
    const [lowSupplyItems, setLowSupplyItems] = useState<LowSupplyItem[]>(props.lowSupplyItems || [])
    const [orderBy, setOrderBy] = useState('-supply')
    const [nameFilter, setNameFilter] = useState<string | null>()
    const [volumeFilter, setVolumeFilter] = useState<number | null>()
    const [medianPriceFilter, setMedianPriceFilter] = useState<number | null>()

    function onSupplyClick() {
        const o = orderBy === 'supply' ? '-supply' : 'supply'
        onOrderChange(o)
    }

    function onMedianClick() {
        const o = orderBy === 'medianPrice' ? '-medianPrice' : 'medianPrice'
        onOrderChange(o)
    }

    function onVolumeClick() {
        const o = orderBy === 'volume' ? '-volume' : 'volume'
        onOrderChange(o)
    }

    function onNameClick() {
        const o = orderBy === 'name' ? '-name' : 'name'
        onOrderChange(o)
    }

    function onOrderChange(order) {
        if (!lowSupplyItems) {
            return
        }
        const key = order.startsWith('-') ? order.substring(1) : order

        const compareFunction = (a, b) => {
            let erg = 0
            if (a[key] < b[key]) {
                erg = -1
            }
            if (a[key] > b[key]) {
                erg = 1
            }
            if (order.startsWith('-')) {
                erg *= -1
            }
            return erg
        }
        const ordered = lowSupplyItems.sort(compareFunction)
        setLowSupplyItems(ordered)
        setOrderBy(order)
    }

    function onNameChange(e: ChangeEvent<HTMLInputElement>) {
        if (e.target.value) {
            setNameFilter(e.target.value)
        } else {
            setNameFilter(null)
        }
    }

    const lowSupplyItemsTableBody = lowSupplyItems
        ? lowSupplyItems.map(item => {
              if (nameFilter && item.name?.toLowerCase().indexOf(nameFilter.toLowerCase()) === -1) {
                  return ''
              }
              if (volumeFilter && item.volume.toString().indexOf(volumeFilter.toString()) === -1) {
                  return ''
              }
              if (medianPriceFilter && item.medianPrice.toString().indexOf(medianPriceFilter.toString()) === -1) {
                  return ''
              }
              return (
                  <tr>
                      <td>
                          <Image crossOrigin="anonymous" src={item.iconUrl || ''} height="32" width="32" alt="" style={{ marginRight: '5px' }} loading="lazy" />
                      </td>
                      <td>{item.name}</td>
                      <td>{item.supply}</td>
                      <td>{item.volume}</td>
                      <td>
                          <Number number={item.medianPrice} />
                      </td>
                  </tr>
              )
          })
        : []

    return (
        <div className={styles.lowSupplyList}>
            {!lowSupplyItems ? (
                getLoadingElement(<p>Loading low supply items</p>)
            ) : lowSupplyItems.length > 0 ? (
                <Card>
                    <Table>
                        <thead>
                            <tr>
                                <th>Icon</th>
                                <th>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <Form.Control style={{ width: 'auto' }} placeholder="Name" onChange={onNameChange} />
                                        <span style={{ cursor: 'pointer' }} onClick={onNameClick}>
                                            {orderBy === 'name' ? <ArrowDownIcon /> : orderBy === '-name' ? <ArrowUpIcon /> : <SortIcon />}
                                        </span>
                                    </div>
                                </th>
                                <th style={{ cursor: 'pointer' }} onClick={onSupplyClick}>
                                    Supply {orderBy === 'supply' ? <ArrowDownIcon /> : orderBy === '-supply' ? <ArrowUpIcon /> : <SortIcon />}
                                </th>
                                <th>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <NumericFormat
                                            id="volume"
                                            onValueChange={numberObject => {
                                                setVolumeFilter(numberObject.floatValue)
                                            }}
                                            placeholder={'Volume'}
                                            type="text"
                                            customInput={Form.Control}
                                            thousandSeparator="."
                                            decimalSeparator=","
                                            allowNegative={false}
                                            decimalScale={0}
                                        />
                                        <span style={{ cursor: 'pointer' }} onClick={onVolumeClick}>
                                            {orderBy === 'volume' ? <ArrowDownIcon /> : orderBy === '-volume' ? <ArrowUpIcon /> : <SortIcon />}
                                        </span>
                                    </div>
                                </th>
                                <th>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <NumericFormat
                                            id="median-price"
                                            onValueChange={numberObject => {
                                                setMedianPriceFilter(numberObject.floatValue)
                                            }}
                                            placeholder={'Median price'}
                                            type="text"
                                            customInput={Form.Control}
                                            thousandSeparator="."
                                            decimalSeparator=","
                                            allowNegative={false}
                                            decimalScale={0}
                                        />
                                        <span style={{ cursor: 'pointer' }} onClick={onMedianClick}>
                                            {orderBy === 'medianPrice' ? <ArrowDownIcon /> : orderBy === '-medianPrice' ? <ArrowUpIcon /> : <SortIcon />}
                                        </span>
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>{lowSupplyItemsTableBody}</tbody>
                    </Table>
                </Card>
            ) : (
                <p>No low volume items found</p>
            )}
        </div>
    )
}

export default LowSupplyList
