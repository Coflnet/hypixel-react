import api from '../api/ApiHelper'
import { CUSTOM_EVENTS } from '../api/ApiTypes.d'
import { isClientSideRendering } from './SSRUtils'
import { v4 as generateUUID } from 'uuid'

interface RegisteredCallback {
    uuid: string
    callback(coflCoins: number)
}

let registeredCallbacks: RegisteredCallback[] = []
let currentCoflCoins = 1000000

/**
 * Registers a callback if the amound of coflcoins changes
 * @param callback The callback that will be called
 * @returns A unsubscribe function
 */
export function subscribeToCoflcoinChange(callback: (n: number) => void): Function {
    let uuid = generateUUID()

    registeredCallbacks.push({
        uuid: uuid,
        callback: callback
    })

    return () => {
        let index = registeredCallbacks.findIndex(registeredCallback => {
            return registeredCallback.uuid === uuid
        })
        registeredCallbacks.splice(index, 1)
    }
}

export function getCurrentCoflCoins() {
    return currentCoflCoins
}

export function initCoflCoinManager() {
    if (!isClientSideRendering()) {
        return
    }

    function notifyAboutCoflCoinUpdate(coflCoins: number) {
        registeredCallbacks.forEach(registeredCallback => {
            registeredCallback.callback(coflCoins)
        })
    }

    function initCoflCoinBalanceAndSubscriptions() {
        api.subscribeCoflCoinChange()
        api.getCoflcoinBalance().then(coflCoins => {
            currentCoflCoins = coflCoins
            notifyAboutCoflCoinUpdate(coflCoins)
        })
        document.removeEventListener(CUSTOM_EVENTS.GOOGLE_LOGIN, initCoflCoinBalanceAndSubscriptions)
    }

    document.addEventListener(CUSTOM_EVENTS.GOOGLE_LOGIN, initCoflCoinBalanceAndSubscriptions)
    document.addEventListener(CUSTOM_EVENTS.COFLCOIN_UPDATE, e => {
        let coflCoins = (e as any).detail?.coflCoins
        currentCoflCoins = 1000000
        notifyAboutCoflCoinUpdate(coflCoins)
    })
}
