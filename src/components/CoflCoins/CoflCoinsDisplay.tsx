import React, { useEffect } from 'react';
import { CustomEvents } from '../../utils/CustomEvents';
import { useCoflCoins } from '../../utils/Hooks';

export function CoflCoinsDisplay() {

    let [coflCoins] = useCoflCoins();

    useEffect(() => {
        loadCoflCoins();
        document.addEventListener(CustomEvents.FLIP_SETTINGS_CHANGE, loadCoflCoins);

        return () => {
            document.removeEventListener(CustomEvents.FLIP_SETTINGS_CHANGE, loadCoflCoins)
        }
    }, []);

    function loadCoflCoins() {

    }

    return (
        <div className="cofl-coins-display">
            <fieldset style={{ width: "max-content", borderRadius: "10px", textAlign: "center" }}>
                <legend>Your CoflCoins</legend>
                <b style={{ fontSize: "x-large" }}>{coflCoins}</b>
            </fieldset>
        </div>
    )
}

/**
 * 
 */
export function getCoflCoins() {

}