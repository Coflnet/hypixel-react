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
import { getURLSearchParam } from '../../utils/Parser/URLParser';

export function MainApp(props: any) {

    const { trackPageView, trackEvent, pushInstruction } = useMatomo()
    const location = useLocation();
    const history = useHistory();

    const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    useEffect(() => {

        pushInstruction("requireConsent");

        let uiStyle = window.localStorage.getItem("uiStyle");
        if ((!uiStyle || uiStyle !== (prefersDarkMode ? 'dark' : 'light'))) {
            window.localStorage.setItem("uiStyle", prefersDarkMode ? 'dark' : 'light')
            trackEvent({
                category: 'uiStyle',
                action: prefersDarkMode ? 'dark' : 'light'
            })
        }

        let refId = getURLSearchParam("refId");
        if (refId) {
            (window as any).refId = refId;
        }

        registerNotificationCallback(history);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location])

    useEffect(() => {
        trackPageView({});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [document.title]);

    const theme = React.useMemo(
        () =>
            createMuiTheme({
                palette: {
                    type: 'dark',
                },
            }),
        [],
    );

    function setTrackingAllowed() {
        pushInstruction("rememberConsentGiven");
        trackPageView({});
    }

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
                onAccept={() => { setTrackingAllowed() }}
            >
                <span data-nosnippet>
                    <p style={{ margin: "0px" }}>We use cookies for analytics. <a href="https://coflnet.com/privacy"> privacy policy </a></p>
                </span>
            </CookieConsent>
            <ToastContainer />
        </ThemeProvider>
    )
}
