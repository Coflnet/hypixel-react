import React, { useState } from "react";
import { GoogleLogin } from "react-google-login";

function GoogleSignIn() {

    let [googleId, setGoogleId] = useState(localStorage.getItem('googleId'));

    const onLoginSucces = (response: any) => {
        localStorage.setItem("googleId", response.googleId);
        setGoogleId(response.googleId);
    };

    return (
        <GoogleLogin
            clientId="570302890760-nlkgd99b71q4d61am4lpqdhen1penddt.apps.googleusercontent.com"
            buttonText="Login"
            onSuccess={onLoginSucces}
            cookiePolicy={"single_host_origin"}
        />
    )
}

export default GoogleSignIn;