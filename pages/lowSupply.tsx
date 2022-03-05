import React, { useState } from 'react'
import Head from 'next/head'
import { Container } from 'react-bootstrap'
import api from '../api/ApiHelper'
import GoogleSignIn from '../components/GoogleSignIn/GoogleSignIn'
import LowSupplyList from '../components/LowSupplyList/LowSupplyList'
import NavBar from '../components/NavBar/NavBar'
import { wasAlreadyLoggedIn } from '../utils/GoogleUtils'
import { getLoadingElement } from '../utils/LoadingUtils'

let wasAlreadyLoggedInGoogle = wasAlreadyLoggedIn()
function LowSupply() {
    let [isLoggedIn, setIsLoggedIn] = useState(false)
    let [hasPremium, setHasPremium] = useState(false)

    function onLogin() {
        let googleId = localStorage.getItem('googleId')
        if (googleId) {
            setIsLoggedIn(true)
            loadHasPremium()
        }
    }

    function onLoginFail() {
        setIsLoggedIn(false)
        wasAlreadyLoggedInGoogle = false
    }

    let loadHasPremium = () => {
        let googleId = localStorage.getItem('googleId')
        api.hasPremium(googleId!).then(hasPremiumUntil => {
            if (hasPremiumUntil > new Date()) {
                setHasPremium(true)
            }
        })
    }

    return (
        <div className="page">
            <Head>
                <title>Low supply items</title>
            </Head>
            <Container>
                <h2>
                    <NavBar />
                    Low supply items
                </h2>
                <hr />
                {isLoggedIn && hasPremium ? (
                    <div>
                        <p>These are low supply items. Strong price fluctuation may occur.</p>
                        <LowSupplyList />
                    </div>
                ) : null}
                {wasAlreadyLoggedInGoogle && !isLoggedIn ? getLoadingElement() : ''}
                {!wasAlreadyLoggedInGoogle && !isLoggedIn ? <p>You need to be logged in and have premium to see this page.</p> : ''}
                {isLoggedIn && !hasPremium ? <p>You need to have premium to see this page.</p> : ''}
                <GoogleSignIn onAfterLogin={onLogin} onLoginFail={onLoginFail} />
            </Container>
        </div>
    )
}

export default LowSupply
