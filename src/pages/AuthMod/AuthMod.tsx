import React, { useEffect, useState } from 'react';
import { Container } from 'react-bootstrap';
import api from '../../api/ApiHelper';
import GoogleSignIn from '../../components/GoogleSignIn/GoogleSignIn';
import NavBar from '../../components/NavBar/NavBar';
import { wasAlreadyLoggedIn } from '../../utils/GoogleUtils';
import { getLoadingElement } from '../../utils/LoadingUtils';
import { getURLSearchParam } from '../../utils/Parser/URLParser';
import './AuthMod.css';

let wasAlreadyLoggedInGoogle = wasAlreadyLoggedIn();

function AuthMod() {

    let [conId] = useState(getURLSearchParam("conId"))
    let [isAuthenticated, setIsAuthenticated] = useState(false);
    let [isLoggedIn, setIsLoggedIn] = useState(wasAlreadyLoggedInGoogle);

    useEffect(() => {
        document.title = "Authenticate Mod";
    }, [])

    function onLogin() {
        setIsLoggedIn(true);

        if (conId) {
            api.authenticateModConnection(parseInt(conId)).then(() => {
                setIsAuthenticated(true);
            })
        }
    }

    function onLoginFail() {
        setIsLoggedIn(false);
        wasAlreadyLoggedInGoogle = false;
    }

    return (
        <div className="auth-mod-page">
            <Container>
                <h2>
                    <NavBar />
                    Authorize Mod
                </h2>
                <hr />
                <div>
                    {!isLoggedIn ? "" :
                        isAuthenticated ?
                            <p style={{ color: "#40ff00" }}>Your Connection is now authorized</p> :
                            getLoadingElement(<p>Authorizing connection...</p>)
                    }
                    {
                        !isLoggedIn ? <p>Please log in to authenticate for the mod usage</p> : ""
                    }
                </div>
                <GoogleSignIn onAfterLogin={onLogin} onLoginFail={onLoginFail} />
            </Container>
        </div >
    );
}

export default AuthMod;
