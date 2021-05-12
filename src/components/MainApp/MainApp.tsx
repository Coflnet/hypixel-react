import React, { useEffect } from 'react';
import { useMatomo } from '@datapunt/matomo-tracker-react'
import { useLocation } from "react-router-dom";
import CookieConsent from 'react-cookie-consent';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { OfflineBanner } from '../OfflineBanner/OfflineBanner';

import { useHistory } from "react-router-dom";
import registerNotificationCallback from '../../utils/NotificationUtils';
import { createMuiTheme, ThemeProvider } from '@material-ui/core';

export function MainApp(props: any) {

    const { trackPageView } = useMatomo()
    const location = useLocation();
    const history = useHistory();

    const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    useEffect(() => {
        if (prefersDarkMode) {
            let script = document.createElement("link")
            script.rel = "stylesheet";
            script.href = "/bootstrap-dark.css";
            document.getElementsByTagName("head")[0].appendChild(script);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        trackPageView({
            documentTitle: document.title,
            href: window.location.href,
        });
        registerNotificationCallback(history);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location])

    const theme = React.useMemo(
        () =>
            createMuiTheme({
                palette: {
                    type: prefersDarkMode ? 'dark' : 'light',
                },
            }),
        [prefersDarkMode],
    );

    return (
        <ThemeProvider theme={theme}>
            <OfflineBanner />
            {props.children}
            <CookieConsent
                enableDeclineButton
                declineButtonStyle={{ backgroundColor: "rgb(65, 65, 65)", borderRadius: "10px", color: "lightgrey", fontSize: "14px" }}
                buttonStyle={{ backgroundColor: "green", borderRadius: "10px", color: "white", fontSize: "20px" }}
                contentStyle={{ marginBottom: "0px" }}
                buttonText="Yes, I understand"
                declineButtonText="Decline"
                cookieName="nonEssentialCookiesAllowed"
                data-nosnippet
                style={{ paddingLeft: "40px" }}
            >
                <span data-nosnippet>
                    <p style={{ margin: "0px" }}>We use cookies for analytics. <a href="https://coflnet.com/privacy"> privacy policy </a></p>
                </span>
            </CookieConsent>
            <ToastContainer />
        </ThemeProvider>
    )
}