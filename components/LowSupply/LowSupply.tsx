'use client'
import { useState } from 'react'
import api from '../../api/ApiHelper'
import { getLoadingElement } from '../../utils/LoadingUtils'
import { PREMIUM_RANK, hasHighEnoughPremium } from '../../utils/PremiumTypeUtils'
import { useWasAlreadyLoggedIn } from '../../utils/Hooks'
import { parseLowSupplyItem } from '../../utils/Parser/APIResponseParser'
import LowSupplyList from '../LowSupplyList/LowSupplyList'
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn'

interface Props {
    lowSupplyItems: any[]
}

export default function LowSupply(props: Props) {
    let [isLoggedIn, setIsLoggedIn] = useState(false)
    let [hasPremium, setHasPremium] = useState(false)
    let wasAlreadyLoggedIn = useWasAlreadyLoggedIn()

    function onLogin() {
        let googleId = sessionStorage.getItem('googleId')
        if (googleId) {
            setIsLoggedIn(true)
            loadHasPremium()
        }
    }

    function onLoginFail() {
        setIsLoggedIn(false)
    }

    let loadHasPremium = () => {
        api.refreshLoadPremiumProducts(products => {
            setHasPremium(hasHighEnoughPremium(products, PREMIUM_RANK.PREMIUM))
        })
    }

    return (
        <>
            {wasAlreadyLoggedIn && !isLoggedIn ? getLoadingElement() : ''}
            {!wasAlreadyLoggedIn && !isLoggedIn ? <p>You need to be logged in and have premium to see this page.</p> : ''}
            {isLoggedIn && !hasPremium ? <p>You need to have premium to see this page.</p> : ''}
            {isLoggedIn && hasPremium ? (
                <div>
                    <p>These are low supply items. Strong price fluctuations may occur.</p>
                    <LowSupplyList lowSupplyItems={props.lowSupplyItems ? props.lowSupplyItems?.map(parseLowSupplyItem) : []} />
                </div>
            ) : null}
            <GoogleSignIn onAfterLogin={onLogin} onLoginFail={onLoginFail} />
        </>
    )
}
