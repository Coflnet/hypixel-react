'use client'
import HelpIcon from '@mui/icons-material/Help'
import Link from 'next/link'
import { Table } from 'react-bootstrap'
import { Number } from '../../Number/Number'
import Tooltip from '../../Tooltip/Tooltip'
import styles from './PremiumFeatures.module.css'

function PremiumFeatures() {
    let checkIconElement = (
        <td className={styles.premiumProductColumn}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="lime" className="bi bi-check-circle-fill" viewBox="0 0 16 16">
                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
            </svg>
        </td>
    )

    let xIconElement = (
        <td className={styles.premiumProductColumn}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="red" className="bi bi-x-circle-fill" viewBox="0 0 16 16">
                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z" />
            </svg>
        </td>
    )

    return (
        <div className={styles.premiumFeatures}>
            <Table>
                <thead>
                    <tr>
                        <th className={styles.featureColumnHeading}>Feature</th>
                        <th className={styles.premiumProductHeading}>Free</th>
                        <th className={styles.premiumProductHeading}>Starter</th>
                        <th className={styles.premiumProductHeading}>Premium</th>
                        <th className={styles.premiumProductHeading}>Premium+</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className={styles.featureColumn}>Price History</td>
                        {checkIconElement}
                        {checkIconElement}
                        {checkIconElement}
                        {checkIconElement}
                    </tr>
                    <tr>
                        <td className={styles.featureColumn}>Bazaar Data History</td>
                        {checkIconElement}
                        {checkIconElement}
                        {checkIconElement}
                        {checkIconElement}
                    </tr>
                    <tr>
                        <td className={styles.featureColumn}>Auction Explorer</td>
                        {checkIconElement}
                        {checkIconElement}
                        {checkIconElement}
                        {checkIconElement}
                    </tr>
                    <tr>
                        <td className={styles.featureColumn}>Player Auction History</td>
                        {checkIconElement}
                        {checkIconElement}
                        {checkIconElement}
                        {checkIconElement}
                    </tr>
                    <tr>
                        <td className={styles.featureColumn}>Display Active Auctions</td>
                        {checkIconElement}
                        {checkIconElement}
                        {checkIconElement}
                        {checkIconElement}
                    </tr>
                    <tr>
                        <td className={styles.featureColumn}>Top 3 Kat Flips</td>
                        {xIconElement}
                        {checkIconElement}
                        {checkIconElement}
                        {checkIconElement}
                    </tr>
                    <tr>
                        <td className={styles.featureColumn}>Top 3 Craft Flips</td>
                        {xIconElement}
                        {checkIconElement}
                        {checkIconElement}
                        {checkIconElement}
                    </tr>
                    <tr>
                        <td className={styles.featureColumn}>Full Access to Flipper Filters</td>
                        {xIconElement}
                        {checkIconElement}
                        {checkIconElement}
                        {checkIconElement}
                    </tr>
                    <tr>
                        <td className={styles.featureColumn}>Support the Project</td>
                        {xIconElement}
                        {checkIconElement}
                        {checkIconElement}
                        {checkIconElement}
                    </tr>
                    <tr>
                        <td className={styles.featureColumn}>
                            List of low supply items (<Link href="/lowSupply">here</Link>)
                        </td>
                        {xIconElement}
                        {xIconElement}
                        {checkIconElement}
                        {checkIconElement}
                    </tr>
                    <tr>
                        <td className={styles.featureColumn}>Priority Feature Request</td>
                        {xIconElement}
                        {xIconElement}
                        {checkIconElement}
                        {checkIconElement}
                    </tr>
                    <tr>
                        <td className={styles.featureColumn}>Discord Role</td>
                        {xIconElement}
                        {xIconElement}
                        {checkIconElement}
                        {checkIconElement}
                    </tr>
                    <tr>
                        <td className={styles.featureColumn}>Max. Recent/Active Auctions</td>
                        <td className={styles.premiumProductColumn}>12</td>
                        <td className={styles.premiumProductColumn}>60</td>
                        <td className={styles.premiumProductColumn}>120</td>
                        <td className={styles.premiumProductColumn}>120</td>
                    </tr>
                    <tr>
                        <td className={styles.featureColumn}>Max. Notifications</td>
                        <td className={styles.premiumProductColumn}>3</td>
                        <td className={styles.premiumProductColumn}>10</td>
                        <td className={styles.premiumProductColumn}>100</td>
                        <td className={styles.premiumProductColumn}>
                            <Number number={1000} />
                        </td>
                    </tr>
                    <tr>
                        <td className={styles.featureColumn}>Chat Colors</td>
                        <td className={styles.premiumProductColumn} style={{ color: 'gray', fontWeight: 'bold' }}>
                            Gray
                        </td>
                        <td className={styles.premiumProductColumn} style={{ color: 'white', fontWeight: 'bold' }}>
                            White
                        </td>
                        <td className={styles.premiumProductColumn} style={{ color: '#32de84', fontWeight: 'bold' }}>
                            Green
                        </td>
                        <td className={styles.premiumProductColumn} style={{ color: '#ffaa00', fontWeight: 'bold' }}>
                            Gold
                        </td>
                    </tr>
                    <tr>
                        <td className={styles.featureColumn}>
                            Average flip receive time
                            <Tooltip
                                content={
                                    <span style={{ marginLeft: '5px' }}>
                                        <HelpIcon />
                                    </span>
                                }
                                type="hover"
                                tooltipContent={
                                    <p>
                                        The Hypixel Auctions API updates once every 60 seconds. After we were able to load new auctions, this is how long it
                                        will take until they are shown to you. (Parsing auctions, finding references, comparing to determine profit,
                                        distributing and filtering and sending to you)
                                    </p>
                                }
                            />
                        </td>
                        <td className={styles.premiumProductColumn}>40 sec</td>
                        <td className={styles.premiumProductColumn}>10-20 sec</td>
                        <td className={styles.premiumProductColumn}>~1 sec</td>
                        <td className={styles.premiumProductColumn}>&lt; 1 sec</td>
                    </tr>
                </tbody>
            </Table>
        </div>
    )
}

export default PremiumFeatures
