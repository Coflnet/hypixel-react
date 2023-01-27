import React from 'react'
import { Subscription, SubscriptionType } from '../../../api/ApiTypes.d'
import styles from './SubscribePlayerContent.module.css'

interface Props {
    onGotOutbidChange(value: boolean)
    onIsSoldChange(value: boolean)
    onIsPlayerAuctionCreation(value: boolean)
    prefill?: Subscription
}

function SubscribePlayerContent(props: Props) {
    return (
        <>
            <div className="player-forms">
                <h4 style={{ marginBottom: '20px' }}>Notify me...</h4>
                <div className="input-data">
                    <input
                        type="checkbox"
                        defaultChecked={
                            props.prefill && (props.prefill.types as unknown as string[]).includes(SubscriptionType[SubscriptionType.PLAYER_CREATES_AUCTION])
                        }
                        className={styles.checkBox}
                        id="isPlayerAuctionCreation"
                        onChange={e => props.onIsPlayerAuctionCreation((e.target as HTMLInputElement).checked)}
                    />
                    <label htmlFor="isPlayerAuctionCreation">if the player creates an auction</label>
                </div>
                <div className="input-data">
                    <input
                        defaultChecked={props.prefill && (props.prefill.types as unknown as string[]).includes(SubscriptionType[SubscriptionType.OUTBID])}
                        type="checkbox"
                        className={styles.checkBox}
                        id="outbidCheckbox"
                        onChange={e => props.onGotOutbidChange((e.target as HTMLInputElement).checked)}
                    />
                    <label htmlFor="outbidCheckbox">if the player gets outbid</label>
                </div>
                <div className="input-data">
                    <input
                        defaultChecked={props.prefill && (props.prefill.types as unknown as string[]).includes(SubscriptionType[SubscriptionType.SOLD])}
                        type="checkbox"
                        className={styles.checkBox}
                        id="isSoldCheckbox"
                        onChange={e => props.onIsSoldChange((e.target as HTMLInputElement).checked)}
                    />
                    <label htmlFor="isSoldCheckbox">if an auction of the player has ended</label>
                </div>
            </div>
        </>
    )
}

export default SubscribePlayerContent
