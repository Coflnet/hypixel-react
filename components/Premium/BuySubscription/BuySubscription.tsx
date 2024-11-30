import { useState } from 'react'
import BuyPremiumConfirmationDialog from '../BuyPremiumConfirmationDialog/BuyPremiumConfirmationDialog'
import { PREMIUM_TYPES } from '../../../utils/PremiumTypeUtils'
import api from '../../../api/ApiHelper'
import { Button, Card, Col, Row } from 'react-bootstrap'
import styles from './BuySubscription.module.css'
import NumberElement from '../../Number/Number'

interface Props {
    activePremiumProduct: PremiumProduct
}

function BuySubscription(props: Props) {
    const [selectedPremiumType, setSelectedPremiumType] = useState<PremiumType>()

    function getSubscriptionPrice() {
        if (!selectedPremiumType) {
            return -1
        }
        if (selectedPremiumType.productId === 'premium') {
            return 8.69
        }
        if (selectedPremiumType.productId === 'premium_plus') {
            return 29.69
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

        api.purchasePremiumSubscription(productId, googleToken).then(data => {
            window.open(data.directLink, '_self')
        })
    }

    return (
        <>
            <Row>
                <Col>
                    <Card>
                        <Card.Header>
                            <Card.Title><b>Premium+</b></Card.Title>
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
                                        setSelectedPremiumType(PREMIUM_TYPES.find(type => type.productId === 'premium_plus'))
                                    }}
                                >
                                    <NumberElement number={29.69} /> Euro (+VAT) / 4 weeks
                                </Button>
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
                    purchasePrice={<>{getSubscriptionPrice()} per month</>}
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
