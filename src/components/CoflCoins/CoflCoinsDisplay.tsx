import React, { useEffect, useState } from 'react';
import { CustomEvents } from '../../utils/CustomEvents';

export function CoflCoinsDisplay() {

    let [coflCoins, setCoflCoins] = useState(0);

    useEffect(() => {
        loadCoflCoins();
        document.addEventListener(CustomEvents.FLIP_SETTINGS_CHANGE, loadCoflCoins);

        return () => {
            document.removeEventListener(CustomEvents.FLIP_SETTINGS_CHANGE, loadCoflCoins)
        }
    }, []);

    function loadCoflCoins() {
        // TODO: How to load coflcoins
    }

    return (
        <div className="cofl-coins-display">
            <fieldset style={{ width: "fit-content", borderRadius: "10px", textAlign: "center" }}>
                <legend>Your CoflCoins</legend>
                <b style={{ fontSize: "x-large" }}>{coflCoins}</b>
            </fieldset>
        </div>
    )
}