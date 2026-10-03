'use client'
import moment from 'moment'
import { type JSX } from 'react'
import Card from 'react-bootstrap/Card'
import { Alert, Button, Table } from 'react-bootstrap'
import { useBazaarSnapshot } from '../../../../hooks/useBazaarSnapshot'
import Number from '../../../Number/Number'
import styles from './BazaarSnapshot.module.css'

interface Props {
    item: Item
}

function BazaarSnapshot(props: Props) {
    const { snapshot: bazaarSnapshot, hasError: hasSnapshotError, retry: retrySnapshot } = useBazaarSnapshot(props.item.tag)

    function getInformationBody(data: BazaarSnapshotData, type: string): JSX.Element {
        return (
            <div>
                <p>
                    <span className={styles.label}>Orders:</span>
                    <Number number={data.orderCount} />
                </p>
                <p>
                    <span className={styles.label}>Price:</span>
                    <Number number={data.price} /> Coins
                </p>
                <p>
                    <span className={styles.label}>Volume:</span>
                    <Number number={data.volume} />
                </p>
                <p>
                    <span className={styles.label}>Average insta-{type}:</span>
                    <Number number={data.moving} /> items/week
                </p>
            </div>
        )
    }

    function getOrderListElement(orders: BazaarOrder[], maxAmount: number, type: 'buy' | 'sell'): JSX.Element {
        const color = type === 'buy' ? 'rgba(40, 167, 69, 0.2)' : 'rgba(220, 53, 69, 0.2)'
        return (
            <Table style={{ borderCollapse: 'separate', borderSpacing: '0 4px' }}>
                <thead>
                    <tr>
                        <th>Price per unit</th>
                        <th>Amount</th>
                        <th>Orders</th>
                        <th>Coin Equivalent</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map(order => (
                        <tr
                            key={order.pricePerUnit}
                            className={styles.orderRow}
                            style={
                                {
                                    '--gradient-color': color,
                                    '--gradient-width': `${(order.amount / maxAmount) * 100}%`
                                } as React.CSSProperties
                            }
                        >
                            <td>
                                <Number number={order.pricePerUnit} /> Coins
                            </td>
                            <td>
                                <Number number={order.amount} />
                            </td>
                            <td>{order.orders}</td>
                            <td>
                                <Number number={order.pricePerUnit * order.amount} /> Coins
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        )
    }

    const errorNotice = hasSnapshotError ? (
        <Alert variant="warning">
            Could not update Bazaar order data.{' '}
            <Button variant="outline-secondary" size="sm" onClick={() => retrySnapshot()}>
                Retry snapshot
            </Button>
        </Alert>
    ) : null

    if (!bazaarSnapshot) return errorNotice

    const allOrders = [...bazaarSnapshot.buyOrders, ...bazaarSnapshot.sellOrders]
    const maxAmount = Math.max(...allOrders.map(o => o.amount), 0)

    return (
        <>
            {errorNotice}
            <h3 className={styles.headline}>
                {bazaarSnapshot.item.name}Bazaar Snaphot ({moment(bazaarSnapshot.timeStamp).format('MMMM Do YYYY, h:mm:ss a')})
            </h3>
            <div className={styles.flex}>
                <Card className={styles.informationField}>
                    <Card.Header>
                        <Card.Title>(Insta) Buy information</Card.Title>
                    </Card.Header>
                    <Card.Body>{getInformationBody(bazaarSnapshot.buyData, 'buys')}</Card.Body>
                </Card>
                <Card className={styles.informationField}>
                    <Card.Header>
                        <Card.Title>(Insta) Sell information</Card.Title>
                    </Card.Header>
                    <Card.Body>{getInformationBody(bazaarSnapshot.sellData, 'sells')}</Card.Body>
                </Card>
            </div>
            <div className={styles.flex}>
                <Card className={styles.informationField}>
                    <Card.Header>
                        <Card.Title>Sell orders</Card.Title>
                    </Card.Header>
                    <Card.Body>{getOrderListElement(bazaarSnapshot.buyOrders, maxAmount, 'sell')}</Card.Body>
                </Card>
                <Card className={styles.informationField}>
                    <Card.Header>
                        <Card.Title>Buy orders</Card.Title>
                    </Card.Header>
                    <Card.Body>{getOrderListElement(bazaarSnapshot.sellOrders, maxAmount, 'buy')}</Card.Body>
                </Card>
            </div>
        </>
    )
}

export default BazaarSnapshot
