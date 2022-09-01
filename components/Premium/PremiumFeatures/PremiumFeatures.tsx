import React from 'react'
import { Table } from 'react-bootstrap'
import Link from 'next/link'
import styles from './PremiumFeatures.module.css'
import { getDecimalSeperator } from '../../../utils/Formatter'
import Tooltip from '../../Tooltip/Tooltip'
import { Help as HelpIcon } from '@mui/icons-material'

function PremiumFeatures() {
    let checkIcon = (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="lime" className="bi bi-check-circle-fill" viewBox="0 0 16 16">
            <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
        </svg>
    )

    let xIcon = (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="red" className="bi bi-x-circle-fill" viewBox="0 0 16 16">
            <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z" />
        </svg>
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
                        <td className={styles.featureColumn}>Price history</td>
                        <td className={styles.premiumProductColumn}>{checkIcon}</td>
                        <td className={styles.premiumProductColumn}>{checkIcon}</td>
                        <td className={styles.premiumProductColumn}>{checkIcon}</td>
                        <td className={styles.premiumProductColumn}>{checkIcon}</td>
                    </tr>
                    <tr>
                        <td className={styles.featureColumn}>Auction explorer</td>
                        <td className={styles.premiumProductColumn}>{checkIcon}</td>
                        <td className={styles.premiumProductColumn}>{checkIcon}</td>
                        <td className={styles.premiumProductColumn}>{checkIcon}</td>
                        <td className={styles.premiumProductColumn}>{checkIcon}</td>
                    </tr>
                    <tr>
                        <td className={styles.featureColumn}>Player auction history</td>
                        <td className={styles.premiumProductColumn}>{checkIcon}</td>
                        <td className={styles.premiumProductColumn}>{checkIcon}</td>
                        <td className={styles.premiumProductColumn}>{checkIcon}</td>
                        <td className={styles.premiumProductColumn}>{checkIcon}</td>
                    </tr>
                    <tr>
                        <td className={styles.featureColumn}>Display active auctions</td>
                        <td className={styles.premiumProductColumn}>{checkIcon}</td>
                        <td className={styles.premiumProductColumn}>{checkIcon}</td>
                        <td className={styles.premiumProductColumn}>{checkIcon}</td>
                        <td className={styles.premiumProductColumn}>{checkIcon}</td>
                    </tr>
                    <tr>
                        <td className={styles.featureColumn}>Top 3 Kat flips</td>
                        <td className={styles.premiumProductColumn}>{xIcon}</td>
                        <td className={styles.premiumProductColumn}>{checkIcon}</td>
                        <td className={styles.premiumProductColumn}>{checkIcon}</td>
                        <td className={styles.premiumProductColumn}>{checkIcon}</td>
                    </tr>
                    <tr>
                        <td className={styles.featureColumn}>Top 3 Craft flips</td>
                        <td className={styles.premiumProductColumn}>{xIcon}</td>
                        <td className={styles.premiumProductColumn}>{checkIcon}</td>
                        <td className={styles.premiumProductColumn}>{checkIcon}</td>
                        <td className={styles.premiumProductColumn}>{checkIcon}</td>
                    </tr>
                    <tr>
                        <td className={styles.featureColumn}>Full access to flipper filters</td>
                        <td className={styles.premiumProductColumn}>{xIcon}</td>
                        <td className={styles.premiumProductColumn}>{checkIcon}</td>
                        <td className={styles.premiumProductColumn}>{checkIcon}</td>
                        <td className={styles.premiumProductColumn}>{checkIcon}</td>
                    </tr>
                    <tr>
                        <td className={styles.featureColumn}>Up to 100 notifications</td>
                        <td className={styles.premiumProductColumn}>{xIcon}</td>
                        <td className={styles.premiumProductColumn}>{checkIcon}</td>
                        <td className={styles.premiumProductColumn}>{checkIcon}</td>
                        <td className={styles.premiumProductColumn}>{checkIcon}</td>
                    </tr>
                    <tr>
                        <td className={styles.featureColumn}>
                            List of low supply items (<Link href="/lowSupply">here</Link>)
                        </td>
                        <td className={styles.premiumProductColumn}>{xIcon}</td>
                        <td className={styles.premiumProductColumn}>{checkIcon}</td>
                        <td className={styles.premiumProductColumn}>{checkIcon}</td>
                        <td className={styles.premiumProductColumn}>{checkIcon}</td>
                    </tr>
                    <tr>
                        <td className={styles.featureColumn}>Priority feature request</td>
                        <td className={styles.premiumProductColumn}>{xIcon}</td>
                        <td className={styles.premiumProductColumn}>{xIcon}</td>
                        <td className={styles.premiumProductColumn}>{checkIcon}</td>
                        <td className={styles.premiumProductColumn}>{checkIcon}</td>
                    </tr>
                    <tr>
                        <td className={styles.featureColumn}>Discord role "Flipper" (on request)</td>
                        <td className={styles.premiumProductColumn}>{xIcon}</td>
                        <td className={styles.premiumProductColumn}>{xIcon}</td>
                        <td className={styles.premiumProductColumn}>{checkIcon}</td>
                        <td className={styles.premiumProductColumn}>{checkIcon}</td>
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
                                        Hypixel updates once every 60 seconds. After the we receive the new auctions this is how long it will take for you to
                                        get the flips.
                                    </p>
                                }
                            />
                        </td>
                        <td className={styles.premiumProductColumn}>2{getDecimalSeperator()}5 min</td>
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
