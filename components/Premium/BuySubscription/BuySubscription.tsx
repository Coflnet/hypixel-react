import { useState } from 'react'
import BuyPremiumConfirmationDialog from '../BuyPremiumConfirmationDialog/BuyPremiumConfirmationDialog'
import { PREMIUM_TYPES } from '../../../utils/PremiumTypeUtils'
import api from '../../../api/ApiHelper'
import { Button, Card, Col, Row } from 'react-bootstrap'
import styles from './BuySubscription.module.css'
import NumberElement from '../../Number/Number'
import Countdown from 'react-countdown'

interface Props {
    activePremiumProduct: PremiumProduct
}

function BuySubscription(props: Props) {
    const [selectedPremiumType, setSelectedPremiumType] = useState<PremiumType>()
    const [isYearOption, setIsYearOption] = useState<boolean>()

    function getSubscriptionPrice() {
        if (!selectedPremiumType) {
            return -1
        }
        if (selectedPremiumType.productId === 'premium') {
            return isYearOption ? 96.69 : 8.69
        }
        if (selectedPremiumType.productId === 'premium_plus') {
            return isYearOption ? 354.2 : 35.69
        }
        return -1
    }

    function onSubscriptionBuyCancel() {
        setSelectedPremiumType(undefined)
    }

    function onSubscriptionBuy(googleToken: string) {
        if (!selectedPremiumType) {
            return
        }
        let productId = ''
        if (selectedPremiumType.productId === 'premium') {
            productId = 'l_premium'
        }
        if (selectedPremiumType.productId === 'premium_plus') {
            productId = 'l_prem_plus'
        }
        if (isYearOption) {
            productId += '-year'
        }

        api.purchasePremiumSubscription(productId, googleToken).then(data => {
            window.open(data.directLink, '_self')
        })
    }

    return (
        <>
            <Row>
                <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                    <div
                        className={styles.coflCoinsText}
                        style={{
                            backgroundColor: '#4CAF50',
                            color: 'black',
                            textAlign: 'center',
                            padding: '10px',
                            position: 'relative',
                            width: '100%',
                            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                            fontWeight: 'bold'
                        }}
                    >
                        <span style={{ fontSize: '32px', fontFamily: 'Arial, sans-serif' }}>EASTER SALE:</span>
                        <br />
                        <p>
                            Use code <code style={{ color: 'black', fontWeight: 'bolder', fontSize: 'large', backgroundColor: 'lightgreen' }}>EASTER</code> at
                            checkout, to get a <span style={{ backgroundColor: 'lightgreen' }}>30% discount</span> for your next month
                        </p>
                        <p>
                            Use code <code style={{ color: 'black', fontWeight: 'bolder', fontSize: 'large', backgroundColor: 'lightgreen' }}>EASTERSHORT</code>{' '}
                            at checkout, to get a <span style={{ backgroundColor: 'lightgreen' }}>20% discount</span> for the next 6 months
                        </p>
                        Time left:{' '}
                        <span style={{ color: 'black', fontWeight: 'bolder', fontSize: 'large' }}>
                            <Countdown date={new Date('2025-04-22T00:00:00.000Z')} />
                        </span>
                    </div>
                </div>
                <Col>
                    <Card>
                        <Card.Header>
                            <Card.Title>
                                <b>Premium+</b>
                            </Card.Title>
                        </Card.Header>
                        <Card.Body>
                            <ul>
                                <li>top flip receive time</li>
                                <li>all tools for analysis</li>
                                <li>full auction archive</li>
                            </ul>
                            <div className={styles.purchaseButtonContainer}>
                                <Button
                                    variant="success"
                                    className={styles.purchaseButton}
                                    onClick={() => {
                                        setIsYearOption(false)
                                        setSelectedPremiumType(PREMIUM_TYPES.find(type => type.productId === 'premium_plus'))
                                    }}
                                >
                                    <NumberElement number={35.69} /> Euro (+VAT) / 4 weeks
                                </Button>
                                {!props.activePremiumProduct || props.activePremiumProduct.expires.getTime() < new Date().getTime() + 3600 * 24 * 3 ? (
                                    <>
                                        <p>
                                            Use code <code>M2OTC1OQ</code> at checkout, to get an extra <b>20% discount</b> on the yearly options
                                        </p>
                                        <Button
                                            variant="success"
                                            className={styles.purchaseButton}
                                            onClick={() => {
                                                setIsYearOption(true)
                                                setSelectedPremiumType(PREMIUM_TYPES.find(type => type.productId === 'premium_plus'))
                                            }}
                                        >
                                            <NumberElement number={354.2} /> Euro (+VAT) / 52 weeks (23% off)
                                        </Button>
                                    </>
                                ) : null}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col>
                    <Card>
                        <Card.Header>
                            <Card.Title>Premium</Card.Title>
                        </Card.Header>
                        <Card.Body>
                            <ul>
                                <li>up to 1s slower than prem+</li>
                                <li>a lot of tools</li>
                                <li>extended history & filter access</li>
                            </ul>
                            <div className={styles.purchaseButtonContainer}>
                                <Button
                                    variant="success"
                                    className={styles.purchaseButton}
                                    onClick={() => {
                                        setSelectedPremiumType(PREMIUM_TYPES.find(type => type.productId === 'premium'))
                                    }}
                                >
                                    <NumberElement number={8.69} /> Euro (+VAT) / 4 weeks
                                </Button>
                                <Button
                                    variant="success"
                                    className={styles.purchaseButton}
                                    onClick={() => {
                                        setIsYearOption(true)
                                        setSelectedPremiumType(PREMIUM_TYPES.find(type => type.productId === 'premium'))
                                    }}
                                >
                                    <NumberElement number={96.69} /> Euro (+VAT) / 52 weeks (14% off)
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            {selectedPremiumType && (
                <BuyPremiumConfirmationDialog
                    type="subscription"
                    show={selectedPremiumType !== undefined}
                    purchasePremiumOption={PREMIUM_TYPES.find(type => type.productId === 'premium')?.options[0]!}
                    purchasePrice={
                        <>
                            {getSubscriptionPrice()} {isYearOption ? 'per year' : 'per month'}
                        </>
                    }
                    purchasePremiumType={selectedPremiumType!}
                    onHide={onSubscriptionBuyCancel}
                    onConfirm={onSubscriptionBuy}
                    activePremiumProduct={props.activePremiumProduct}
                />
            )}
        </>
    )
}

export default BuySubscription
