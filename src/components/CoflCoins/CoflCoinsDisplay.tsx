import React, { useEffect, useState } from 'react';
import { CustomEvents } from '../../utils/CustomEvents';
import { useCoflCoins } from '../../utils/Hooks';
import { getLoadingElement } from '../../utils/LoadingUtils';

export function CoflCoinsDisplay() {

    let [coflCoins] = useCoflCoins();
    let [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadCoflCoins();
        document.addEventListener(CustomEvents.FLIP_SETTINGS_CHANGE, loadCoflCoins);

        return () => {
            document.removeEventListener(CustomEvents.FLIP_SETTINGS_CHANGE, loadCoflCoins)
        }
    }, []);

    useEffect(() => {
        if (coflCoins !== -1) {
            setIsLoading(false);
        } else {
            setIsLoading(true);
        }
    }, [coflCoins])

    function loadCoflCoins() {

    }

    return (
        <div className="cofl-coins-display">
            <fieldset style={{ width: "max-content", borderRadius: "10px", textAlign: "center" }}>
                <legend>Your CoflCoins</legend>
                {
                    isLoading ?
                        getLoadingElement(<span />) :
                        <b style={{ fontSize: "x-large" }}>{coflCoins}</b>
                }
            </fieldset>
        </div>
    )
}

/**
 * 
 */
export function getCoflCoins() {

}