import React, { useEffect, useState } from 'react';
import { Container } from 'react-bootstrap';
import api from '../../api/ApiHelper';
import NavBar from '../../components/NavBar/NavBar';
import { getLoadingElement } from '../../utils/LoadingUtils';
import { getURLSearchParam } from '../../utils/Parser/URLParser';
import './AuthMod.css';

function AuthMod() {

    let [conId] = useState(getURLSearchParam("conId"))
    let [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        document.title = "Authenticate Mod";

        if (conId) {
            api.authenticateModConnection(parseInt(conId)).then(() => {
                setIsAuthenticated(true);
            })
        }
    }, [])

    return (
        <div className="auth-mod-page">
            <Container>
                <h2>
                    <NavBar />
                    Authorize Mod
                </h2>
                <hr />
                <div>
                    {
                        isAuthenticated ?
                            <p style={{ color: "#40ff00" }}>Your Connection is now authorized</p> :
                            <p>{getLoadingElement(<p>Authorizing connection...</p>)}</p>
                    }
                </div>
            </Container>
        </div >
    );
}

export default AuthMod;
