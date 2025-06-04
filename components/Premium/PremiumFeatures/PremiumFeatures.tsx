'use client'
import HelpIcon from '@mui/icons-material/Help'
import Link from 'next/link'
import { Table } from 'react-bootstrap'
import Number from '../../Number/Number'
import Tooltip from '../../Tooltip/Tooltip'
import styles from './PremiumFeatures.module.css'
import Image from 'next/image'

function PremiumFeatures() {
    return (
        <div className={styles.premiumFeatures}>
            <h2>Website Features</h2>
            <div className={styles.featureCardRow}>
                <div className={styles.featureCard}>
                    <div className={styles.featureTitle}>Price History</div>
                    <p className={styles.featureDescription}>Track the historical prices of items to make informed decisions.</p>
                </div>
                <div className={styles.featureCard}>
                    <div className={styles.featureTitle}>Bazaar Data History</div>
                    <p className={styles.featureDescription}>Access detailed historical data from the Bazaar for analysis.</p>
                </div>
                <div className={styles.featureCard}>
                    <div className={styles.featureTitle}>Auction Explorer</div>
                    <p className={styles.featureDescription}>Explore active auctions and find the best deals available.</p>
                </div>
                <div className={styles.featureCard}>
                    <div className={styles.featureTitle}>Player Auction History</div>
                    <p className={styles.featureDescription}>View the auction history of specific players for insights.</p>
                </div>
                <div className={styles.featureCard}>
                    <div className={styles.featureTitle}>Display Active Auctions</div>
                    <p className={styles.featureDescription}>Get a real-time view of all active auctions in the marketplace.</p>
                </div>
                <div className={styles.featureCard}>
                    <div className={styles.featureTitle}>Top 3 Kat Flips</div>
                </div>
                <div className={styles.featureCard}>
                    <div className={styles.featureTitle}>Top 3 Craft Flips</div>
                </div>
                <div className={styles.featureCard}>
                    <div className={styles.featureTitle}>Max. Recent/Active Auctions</div>
                    <td className={styles.premiumProductColumn}>12</td>
                    <td className={styles.premiumProductColumn}>60</td>
                    <td className={styles.premiumProductColumn}>120</td>
                    <td className={styles.premiumProductColumn}>120</td>
                </div>
                <div className={styles.featureCard}>
                    <div className={styles.featureTitle}>
                        List of low supply items (<Link href="/lowSupply">here</Link>)
                    </div>
                </div>
                <div className={styles.featureCard}>
                    <div className={styles.featureTitle}>Filter player auctions</div>
                </div>
            </div>
            <h2 className='mt-5'>Flipping Features</h2>
            <div className={styles.featureCardRow}>
                <div className={styles.featureCard}>
                    <div className={styles.featureTitle}>
                        Average flip receive time
                    </div>
                    <p>
                        The Hypixel Auctions API updates once every 60 seconds. After we were able to load new auctions, this is how long it
                        will take until they are shown to you. (Parsing auctions, finding references, comparing to determine profit,
                        distributing and filtering and sending to you)
                    </p>
                    <td className={styles.premiumProductColumn}>40 sec</td>
                    <td className={styles.premiumProductColumn}>10-20 sec</td>
                    <td className={styles.premiumProductColumn}>~1 sec</td>
                    <td className={styles.premiumProductColumn}>&lt; 1 sec</td>
                </div>
                <div className={styles.featureCard}>
                    <div className={styles.featureTitle}>Longer flip-tracking history</div>
                </div>
                <div className={styles.featureCard}>
                    <div className={styles.featureTitle}>
                        Look at `buyspeed` and `most profit` leaderboard
                    </div>
                    <p>This is currently available in our mod via the command /cl leaderbaord and /cl buyspeedboard</p>
                </div>
                <div className={styles.featureCard}>
                    <div className={styles.featureTitle}>Full Access to Flipper Filters</div>
                </div>
                <div className={styles.featureCard}>
                    <div className={styles.featureTitle}>
                        Replay flips
                    </div>
                    <p>Replay all active auctions against your flip filter to find flips that were created while you were offline</p>
                </div>
            </div>
            <h2 className='mt-5'>Mod Features</h2>
            <div className={styles.featureCardRow}>
                <div className={styles.featureCard}>
                    <div className={styles.featureTitle}>Refresh time of /cofl cheapmuseum </div>
                    <td className={styles.premiumProductColumn}>2 h</td>
                    <td className={styles.premiumProductColumn}>5 min</td>
                    <td className={styles.premiumProductColumn}>2 min</td>
                    <td className={styles.premiumProductColumn}>2 min</td>
                </div>
                <div className={styles.featureCard}>
                    <div className={styles.featureTitle}>Use /cofl forge in game</div>
                    <p>The top 3 options require a paid plan</p>
                </div>
                <div className={styles.featureCard}>
                    <div className={styles.featureTitle}>Chat Colors</div>
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
                </div>
                <div className={styles.featureCard}>
                    <div className={styles.featureTitle}>Price estimations in game</div>
                    <p className={styles.featureDescription}>Receive accurate price estimations directly within the game.</p>
                    <Image height={648} width={1220} style={{ width: "100%", height: "auto" }} src="/price-estimation-ingame.png" alt="Price Estimation Tooltip" />
                </div>
            </div>
            <h2 className='mt-5'>Other benefits</h2>
            <div className={styles.featureCardRow}>
                <div className={styles.featureCard}>
                    <div className={styles.featureTitle}>Support the Project</div>
                </div>
                <div className={styles.featureCard}>
                    <div className={styles.featureTitle}>More Notifications</div>
                </div>
                <div className={styles.featureCard}>
                    <div className={styles.featureTitle}>Priority Feature Request</div>
                </div>
                <div className={styles.featureCard}>
                    <div className={styles.featureTitle}>Discord Role</div>
                </div>
            </div>
        </div>
    )
}

export default PremiumFeatures
