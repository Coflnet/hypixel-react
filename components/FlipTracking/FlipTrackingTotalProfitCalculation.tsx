import { useState } from 'react'
import { Form } from 'react-bootstrap'
import Tooltip from '../Tooltip/Tooltip'
import Number from '../Number/Number'
import SettingsIcon from '@mui/icons-material/Settings'

interface Props {
    flips: FlipTrackingFlip[]
    ignoreProfitMap: {}
}

enum TotalProfitType {
    ALL,
    POSITIVE,
    NEGATIVE
}

export function FlipTrackingTotalProfitCalculation(props: Props) {
    let [totalProfitCalculationType, setTotalProfitCalculationType] = useState(TotalProfitType.ALL)                
    let totalProfit = 0
    props.flips.forEach(flip => {
        if (props.ignoreProfitMap[flip.uId.toString(16)]) {
            return
        }
        if (totalProfitCalculationType === TotalProfitType.NEGATIVE && flip.profit >= 0) {
            return
        }
        if (totalProfitCalculationType === TotalProfitType.POSITIVE && flip.profit <= 0) {
            return
        }

        totalProfit += flip.profit
    })

    return (
        <b>
            <p style={{ fontSize: 'x-large', display: 'flex', justifyContent: 'start', alignItems: 'center', gap: 10 }}>
                <Tooltip
                    content={<SettingsIcon style={{ display: 'flex' }} />}
                    type="click"
                    tooltipTitle={<span>Calculation Type:</span>}
                    tooltipContent={
                        <div>
                            <Form.Check>
                                <Form.Check.Input
                                    id="calculationTypeAll"
                                    type="radio"
                                    checked={totalProfitCalculationType === TotalProfitType.ALL}
                                    onChange={e => {
                                        if (e.target.checked) {
                                            setTotalProfitCalculationType(TotalProfitType.ALL)
                                        }
                                    }}
                                    radioGroup="calculationType"
                                />
                                <Form.Check.Label htmlFor="calculationTypeAll">Include all flips</Form.Check.Label>
                            </Form.Check>
                            <Form.Check>
                                <Form.Check.Input
                                    id="calculationTypePositive"
                                    type="radio"
                                    checked={totalProfitCalculationType === TotalProfitType.POSITIVE}
                                    onChange={e => {
                                        if (e.target.checked) {
                                            setTotalProfitCalculationType(TotalProfitType.POSITIVE)
                                        }
                                    }}
                                    radioGroup="calculationType"
                                />
                                <Form.Check.Label htmlFor="calculationTypePositive">Only include flips sold for a profit</Form.Check.Label>
                            </Form.Check>
                            <Form.Check>
                                <Form.Check.Input
                                    id="calculationTypeNegative"
                                    type="radio"
                                    checked={totalProfitCalculationType === TotalProfitType.NEGATIVE}
                                    onChange={e => {
                                        if (e.target.checked) {
                                            setTotalProfitCalculationType(TotalProfitType.NEGATIVE)
                                        }
                                    }}
                                    radioGroup="calculationType"
                                />
                                <Form.Check.Label htmlFor="calculationTypeNegative">Only include flips sold for a loss</Form.Check.Label>
                            </Form.Check>
                        </div>
                    }
                />

                {totalProfitCalculationType === TotalProfitType.NEGATIVE
                    ? 'Only Loss:'
                    : totalProfitCalculationType === TotalProfitType.POSITIVE
                    ? 'Only Profit:'
                    : 'Total Profit:'}
                <span style={{ color: 'gold' }}>
                    <Number number={totalProfit} /> Coins{' '}
                </span>
            </p>
        </b>
    )
}
