import React, { useEffect, useState } from "react";
import { GoogleLogin } from "react-google-login";
import { toast } from "react-toastify";
import api from "../../api/ApiHelper";
import { refreshTokenSetup } from "../../utils/GoogleUtils";
import { useHistory } from "react-router-dom";

interface Props {
    onAfterLogin(): void
}

function GoogleSignIn(props: Props) {

    let [googleId, setGoogleId] = useState(localStorage.getItem("googleId"));
    let history = useHistory();

    useEffect(() => {
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onLoginSucces = (response: any) => {
        localStorage.setItem("googleId", response.tokenId);
        setGoogleId(response.tokenId);
        api.setGoogle(response.tokenId).then(() => {
            let refId = (window as any).refId;
            if (refId) {
                api.setRef(refId).then(() => {
                    toast.success("You received one day of premium for free.", {
                        onClick: () => {
                            history.push({
                                pathname: "/premium"
                            })
                        }
                    });
                });
            }
            refreshTokenSetup(response);
            props.onAfterLogin();
        }).catch(() => {
            toast.error("An Error occoured while trying to sign in with google");
            googleId = null;
            localStorage.removeItem("googleId");
        });
    };

    let style: React.CSSProperties = googleId !== null ? {
        visibility: "collapse",
        height: 0
    } : {};

    return (
        <div style={style}>
            <GoogleLogin
                clientId="570302890760-nlkgd99b71q4d61am4lpqdhen1penddt.apps.googleusercontent.com"
                buttonText="Login"
                onSuccess={onLoginSucces}
                isSignedIn={googleId !== null}
                theme="dark"
                cookiePolicy={"single_host_origin"}
            />
        </div>
    )
}

export default GoogleSignIn;
