import React from "react";
import { GoogleLogin } from "react-google-login";

function GoogleSignIn() {

    const googleId = localStorage.getItem("googleId");

    const onLoginSucces = (response: any) => {
        localStorage.setItem("googleId", response.googleId);
    };

    return (
        !googleId ?
            <GoogleLogin
                clientId="570302890760-nlkgd99b71q4d61am4lpqdhen1penddt.apps.googleusercontent.com"
                buttonText="Login"
                onSuccess={onLoginSucces}
                cookiePolicy={"single_host_origin"}
            /> : <div></div>
    )
}

export default GoogleSignIn;