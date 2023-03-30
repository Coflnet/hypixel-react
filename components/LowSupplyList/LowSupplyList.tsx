import ArrowDownIcon from '@mui/icons-material/ArrowDownward'
import ArrowUpIcon from '@mui/icons-material/ArrowUpward'
import SortIcon from '@mui/icons-material/Sort'
import { useEffect, useState } from 'react'
import { Card, Form, Table } from 'react-bootstrap'
import { getLoadingElement } from '../../utils/LoadingUtils'
import { NumericFormat } from 'react-number-format';
import { numberWithThousandsSeparators } from '../../utils/Formatter'
import styles from './LowSupplyList.module.css'
import Image from 'next/image'

let mounted = true

interface Props {
    lowSupplyItems?: LowSupplyItem[]
}

function LowSupplyList(props: Props) {
    let [lowSupplyItems, setLowSupplyItems] = useState<LowSupplyItem[]>(props.lowSupplyItems || [])
    let [orderBy, setOrderBy] = useState('-supply')
    let [nameFilter, setNameFilter] = useState<string | null>()
    let [volumeFilter, setVolumeFilter] = useState<number | null>()
    let [medianPriceFilter, setMedianPriceFilter] = useState<number | null>()

    useEffect(() => {
        mounted = true
        return () => {
            mounted = false
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    function onSupplyClick() {
        let o = orderBy === 'supply' ? '-supply' : 'supply'
        onOrderChange(o)
    }

    function onMedianClick() {
        let o = orderBy === 'medianPrice' ? '-medianPrice' : 'medianPrice'
        onOrderChange(o)
    }

    function onVolumeClick() {
        let o = orderBy === 'volume' ? '-volume' : 'volume'
        onOrderChange(o)
    }

    function onNameClick() {
        let o = orderBy === 'name' ? '-name' : 'name'
        onOrderChange(o)
    }

    function onOrderChange(order) {
        if (!lowSupplyItems) {
            return
        }
        let key = order.startsWith('-') ? order.substring(1) : order

        let compareFunction = (a, b) => {
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
        let ordered = lowSupplyItems.sort(compareFunction)
        setLowSupplyItems(ordered)
        setOrderBy(order)
    }

    function onNameChange(e: any) {
        if (e.target.value) {
            setNameFilter(e.target.value)
        } else {
            setNameFilter(null)
        }
    }

    let lowSupplyItemsTableBody = lowSupplyItems
        ? lowSupplyItems.map((item, i) => {
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
                          <Image crossOrigin="anonymous" src={item.iconUrl} height="32" alt="" style={{ marginRight: '5px' }} loading="lazy" />
                      </td>
                      <td>{item.name}</td>
                      <td>{item.supply}</td>
                      <td>{item.volume}</td>
                      <td>{numberWithThousandsSeparators(item.medianPrice)}</td>
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
