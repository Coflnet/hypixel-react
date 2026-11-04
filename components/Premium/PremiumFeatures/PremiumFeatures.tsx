'use client'
import HelpIcon from '@mui/icons-material/Help'
import Link from 'next/link'
import { Table } from 'react-bootstrap'
import Number from '../../Number/Number'
import Tooltip from '../../Tooltip/Tooltip'
import styles from './PremiumFeatures.module.css'
import Image from 'next/image'

function ReceiveTimeCell({ measured, path }: { measured: string; path: string }) {
    return (
        <td className={styles.premiumProductColumn}>
            {measured}
            <br />
            <small style={{ opacity: 0.7 }}>{path}</small>
        </td>
    )
}

function PremiumFeatures() {
    const checkIconSvg = (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="lime" className="bi bi-check-circle-fill" viewBox="0 0 16 16">
            <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
        </svg>
    )
    const checkIconElement = <td className={styles.premiumProductColumn}>{checkIconSvg}</td>

    const xIconElement = (
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
                        <td className={styles.featureColumn}>
                            Price estimations in game
                            <Tooltip
                                id={styles.tooltipHoverId}
                                content={
                                    <span style={{ marginLeft: '5px' }}>
                                        <HelpIcon />
                                    </span>
                                }
                                type="hover"
                                tooltipContent={
                                    <div className={styles.ingamePriceHoverImage}>
                                        <Image fill src="/price-estimation-ingame.png" alt="Price Estimation Tooltip" />
                                    </div>
                                }
                            />
                        </td>
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
                        <td className={styles.featureColumn}>Top 3 Bazaar Flips</td>
                        {xIconElement}
                        {checkIconElement}
                        {checkIconElement}
                        {checkIconElement}
                    </tr>
                    <tr>
                        <td className={styles.featureColumn}>Top 3 Forge Flips</td>
                        {xIconElement}
                        {checkIconElement}
                        {checkIconElement}
                        {checkIconElement}
                    </tr>
                    <tr>
                        <td className={styles.featureColumn}>Top 3 Fusion Flips</td>
                        {xIconElement}
                        {checkIconElement}
                        {checkIconElement}
                        {checkIconElement}
                    </tr>
                    <tr>
                        <td className={styles.featureColumn}>
                            Multi-Step Fusion Flips
                            <Tooltip
                                content={
                                    <span style={{ marginLeft: '5px' }}>
                                        <HelpIcon />
                                    </span>
                                }
                                type="hover"
                                tooltipContent={<p>Combine up to 3 levels of fusions for higher profit margins by crafting intermediate shards instead of buying them</p>}
                            />
                        </td>
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
                        <td className={styles.featureColumn}>Top 3 Book Flips</td>
                        {xIconElement}
                        {checkIconElement}
                        {checkIconElement}
                        {checkIconElement}
                    </tr>
                    <tr>
                        <td className={styles.featureColumn}>Top 3 NPC Flips</td>
                        {xIconElement}
                        {checkIconElement}
                        {checkIconElement}
                        {checkIconElement}
                    </tr>
                    <tr>
                        <td className={styles.featureColumn}>Top 3 Attribute Flips</td>
                        {xIconElement}
                        {xIconElement}
                        {checkIconElement}
                        {checkIconElement}
                    </tr>
                    <tr>
                        <td className={styles.featureColumn}>Reverse NPC Flips</td>
                        {xIconElement}
                        {xIconElement}
                        {checkIconElement}
                        {checkIconElement}
                    </tr>
                    <tr>
                        <td className={styles.featureColumn}>Premium Bazaar Flips</td>
                        {xIconElement}
                        {xIconElement}
                        {checkIconElement}
                        {checkIconElement}
                    </tr>
                    <tr>
                        <td className={styles.featureColumn}>Medium Term investment flips (Mayor cycle)</td>
                        {xIconElement}
                        {xIconElement}
                        {xIconElement}
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
                        <td className={styles.featureColumn}>Filter player auctions</td>
                        {xIconElement}
                        {checkIconElement}
                        {checkIconElement}
                        {checkIconElement}
                    </tr>
                    <tr>
                        <td className={styles.featureColumn}>
                            Look at `buyspeed` and `most profit` leaderboard
                            <Tooltip
                                content={
                                    <span style={{ marginLeft: '5px' }}>
                                        <HelpIcon />
                                    </span>
                                }
                                type="hover"
                                tooltipContent={<p>This is currently available in our mod via the command /cl leaderbaord and /cl buyspeedboard</p>}
                            />
                        </td>
                        {xIconElement}
                        {xIconElement}
                        {xIconElement}
                        {checkIconElement}
                    </tr>
                    <tr>
                        <td className={styles.featureColumn}>
                            Replay flips{' '}
                            <Tooltip
                                content={
                                    <span style={{ marginLeft: '5px' }}>
                                        <HelpIcon />
                                    </span>
                                }
                                type="hover"
                                tooltipContent={
                                    <p>Replay all active auctions against your flip filter to find flips that were created while you were offline</p>
                                }
                            />
                        </td>
                        {xIconElement}
                        {xIconElement}
                        {xIconElement}
                        {checkIconElement}
                    </tr>
                    <tr>
                        <td className={styles.featureColumn}>
                            Browse flip block reason 
                            <Tooltip
                                content={
                                    <span style={{ marginLeft: '5px' }}>
                                        <HelpIcon />
                                    </span>
                                }
                                type="hover"
                                tooltipContent={<p>
                                    Retrieve in-game with <br /><code>/cofl blocked &lt;uuid&gt;</code><br/>
                                    Each blocked flip is kept for 7 days
                                    drastically simplifying finding why a
                                    certain flip did not show to you</p>}
                            />
                        </td>
                        {xIconElement}
                        {xIconElement}
                        {xIconElement}
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
                        <td className={styles.featureColumn}>
                            In game lowball helper
                            <Tooltip
                                content={
                                    <span style={{ marginLeft: '5px' }}>
                                        <HelpIcon />
                                    </span>
                                }
                                type="hover"
                                tooltipContent={<p>Autofills the lowball amount based on our pricing data with a configureable undercut</p>}
                            />
                        </td>
                        {xIconElement}
                        {xIconElement}
                        {checkIconElement}
                        {checkIconElement}
                    </tr>
                    <tr>
                        <td className={styles.featureColumn}>Longer flip-tracking history</td>
                        {xIconElement}
                        {xIconElement}
                        {checkIconElement}
                        {checkIconElement}
                    </tr>
                    <tr>
                        <td className={styles.featureColumn}>
                            Access to archive
                            <Tooltip
                                content={
                                    <span style={{ marginLeft: '5px' }}>
                                        <HelpIcon />
                                    </span>
                                }
                                type="hover"
                                tooltipContent={<p>Filter through years of data to get exactly the auction or bazaar data you need</p>}
                            />
                        </td>
                        {xIconElement}
                        {xIconElement}
                        {xIconElement}
                        {checkIconElement}
                    </tr>
                    <tr>
                        <td className={styles.featureColumn}>CSV file exports</td>
                        {xIconElement}
                        {xIconElement}
                        {xIconElement}
                        {checkIconElement}
                    </tr>
                    <tr>
                        <td className={styles.featureColumn}>
                            Bazaar data export (JSON)
                            <Tooltip
                                content={
                                    <span style={{ marginLeft: '5px' }}>
                                        <HelpIcon />
                                    </span>
                                }
                                type="hover"
                                tooltipContent={<p>Export bazaar price history as a zip file containing JSON. Optionally includes full order book.</p>}
                            />
                        </td>
                        {xIconElement}
                        {xIconElement}
                        <td className={styles.premiumProductColumn}>180 days</td>
                        <td className={styles.premiumProductColumn}>~6 years</td>
                    </tr>
                    <tr>
                        <td className={styles.featureColumn}>
                            Access to BazaarPro (<Link href="https://pro.skyblock.bz/skycofl" target="_blank" rel="noreferrer">pro.skyblock.bz</Link>)
                        </td>
                        {xIconElement}
                        {xIconElement}
                        {xIconElement}
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
                        <td className={styles.featureColumn}>Refresh time of /cofl cheapmuseum </td>
                        <td className={styles.premiumProductColumn}>2 h</td>
                        <td className={styles.premiumProductColumn}>5 min</td>
                        <td className={styles.premiumProductColumn}>2 min</td>
                        <td className={styles.premiumProductColumn}>2 min</td>
                    </tr>
                    <tr>
                        <td className={styles.featureColumn}>Use /cofl forge in game</td>
                        <td className={styles.premiumProductColumn}>
                            <Tooltip
                                content={
                                    <span style={{ marginLeft: '5px' }}>
                                        {checkIconSvg}
                                        <HelpIcon />
                                    </span>
                                }
                                type="hover"
                                tooltipContent={<p>The top 3 options require a paid plan</p>}
                            />
                        </td>
                        {checkIconElement}
                        {checkIconElement}
                        {checkIconElement}
                    </tr>
                    <tr>
                        <td className={styles.featureColumn}>Chat Colors</td>
                        <td className={styles.premiumProductColumn} style={{ color: 'gray', fontWeight: 'bold' }}>
                            Gray
                        </td>
                        <td className={styles.premiumProductColumn} style={{ color: 'white', fontWeight: 'bold' }}>
                            White
                        </td>
                        <td className={`${styles.premiumProductColumn} text-success`} style={{ fontWeight: 'bold' }}>
                            Green
                        </td>
                        <td className={`${styles.premiumProductColumn}`} style={{ color: 'gold', fontWeight: 'bold' }}>
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
                                    <>
                                        <p>
                                            Measured from the Hypixel API update until the flip reaches you (average over recent flips). Premium+ is
                                            below 0 because flips that mod users find before the API lists them reach Premium+ first.
                                        </p>
                                        <p>
                                            The second line is the path a flip takes: each lower tier gets it about 0.5 seconds after the tier above
                                            (3-5 seconds when a higher tier&apos;s filter also matched it). Because the path starts at Premium+, even
                                            free users can get some pre-API flips before the Hypixel API update.
                                        </p>
                                    </>
                                }
                            />
                        </td>
                        <ReceiveTimeCell measured="~6 sec" path="+1.5 sec after Premium+" />
                        <ReceiveTimeCell measured="~3 sec" path="+1 sec after Premium+" />
                        <ReceiveTimeCell measured="~0 sec" path="+0.5 sec after Premium+" />
                        <ReceiveTimeCell measured="< 0 sec" path="gets every flip first" />
                    </tr>
                    <tr>
                        <td className={styles.featureColumn}>
                            Typical profit vs. free
                            <Tooltip
                                content={
                                    <span style={{ marginLeft: '5px' }}>
                                        <HelpIcon />
                                    </span>
                                }
                                type="hover"
                                tooltipContent={<p>Median realized profit per user per day (AH flips, bazaar and tasks tracked by the mod) compared to free users. Measured over the last 24 hours on 2026-11-04.</p>}
                            />
                        </td>
                        <td className={styles.premiumProductColumn}>1x</td>
                        <td className={styles.premiumProductColumn}>1.5x</td>
                        <td className={styles.premiumProductColumn}>2.6x</td>
                        <td className={styles.premiumProductColumn}>5.9x</td>
                    </tr>
                </tbody>
            </Table>
        </div>
    )
}

export default PremiumFeatures
