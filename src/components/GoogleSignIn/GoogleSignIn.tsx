import React, { useEffect, useState } from "react";
import { GoogleLogin } from "react-google-login";
import api from "../../api/ApiHelper";

interface Props {
    onAfterLogin(): void
}

function GoogleSignIn(props: Props) {

    let [googleId, setGoogleId] = useState(localStorage.getItem("googleId"));

    useEffect(() => {
        if(googleId){
            onLoginSucces({
                tokenId: googleId
            })
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onLoginSucces = (response: any) => {
        localStorage.setItem("googleId", response.tokenId);
        setGoogleId(response.tokenId);
        api.setGoogle(response.tokenId).then(() => {
            props.onAfterLogin();
        })
    };

    return (
        <div style={googleId !== null ? { display: "none" } : {}}>
            <GoogleLogin
                clientId="570302890760-nlkgd99b71q4d61am4lpqdhen1penddt.apps.googleusercontent.com"
                buttonText="Login"
                onSuccess={onLoginSucces}
                isSignedIn={googleId !== null}
                cookiePolicy={"single_host_origin"}
            />
        </div>
    )
}

export default GoogleSignIn;