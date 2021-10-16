import React, { useEffect, useState } from "react";
import { GoogleLogin } from "react-google-login";
import { toast } from "react-toastify";
import api from "../../api/ApiHelper";
import { refreshTokenSetup } from "../../utils/GoogleUtils";
import { useHistory } from "react-router-dom";
import { useMatomo } from "@datapunt/matomo-tracker-react";
import { useForceUpdate } from "../../utils/Hooks";

interface Props {
    onAfterLogin(): void,
    onLoginFail?(): void,
    rerenderFlip?: boolean
}

let gotResponse = false;

function GoogleSignIn(props: Props) {

    let [googleId, setGoogleId] = useState(localStorage.getItem("googleId"));
    let history = useHistory();
    let { trackEvent } = useMatomo();
    let forceUpdate = useForceUpdate();

    useEffect(() => {
        if (googleId !== null) {
            setTimeout(() => {
                if (!gotResponse) {
                    toast.error('We had problems authenticating your account with google. Please try to log in again.')
                    setGoogleId(null);
                    if(props.onLoginFail){
                        props.onLoginFail();
                    }
                    localStorage.removeItem("googleId");
                }
            }, 15000);
        }
    }, []);

    useEffect(() => {
        setGoogleId(localStorage.getItem("googleId"));
        forceUpdate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.rerenderFlip]);

    const onLoginSucces = (response: any) => {
        gotResponse = true;
        localStorage.setItem("googleId", response.tokenId);
        setGoogleId(response.tokenId);
        api.setGoogle(response.tokenId).then(() => {
            let refId = (window as any).refId;
            if (refId) {
                api.setRef(refId);
            }
            refreshTokenSetup(response);
            props.onAfterLogin();
        }).catch(() => {
            toast.error("An error occoured while trying to sign in with Google");
            googleId = null;
            localStorage.removeItem("googleId");
        });
    };

    const onLoginFail = (response: { error: string, details: string }) => {
        gotResponse = true;
        switch (response.error) {
            case 'access_denied':
            case 'popup_closed_by_user':
                toast.warn("You canceled the login");
                break;
            case 'idpiframe_initialization_failed':
                toast.error("Cookies for accounts.google.com have to be enabled to login", { autoClose: 20000 });
                toast.success("Common fix: if there is an eye icon with a line through in your url bar, click it", { delay: 1000, autoClose: 20000 });
                break;
            default:
                toast.error("Something went wrong, please try again.", { autoClose: 20000 });
                break;
        }
        trackEvent({
            category: 'login',
            action: 'error/' + response.error
        })
    }

    const onLoginClick = () => {
        trackEvent({
            category: 'login',
            action: 'click'
        })
    }

    let style: React.CSSProperties = googleId !== null ? {
        visibility: "collapse",
        height: 0
    } : {};

    return (
        <div style={style} onClickCapture={onLoginClick}>
            <GoogleLogin
                clientId="570302890760-nlkgd99b71q4d61am4lpqdhen1penddt.apps.googleusercontent.com"
                buttonText="Login"
                onSuccess={onLoginSucces}
                onFailure={onLoginFail}
                isSignedIn={googleId !== null}
                theme="dark"
                cookiePolicy={"single_host_origin"}
            />
        </div>
    )
}

export default GoogleSignIn;
