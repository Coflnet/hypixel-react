import { useEffect, useState } from 'react';
import api from '../../api/ApiHelper';
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn';
import { getLoadingElement } from '../../utils/LoadingUtils';
import Link from 'next/link';

interface Props {
    playerUUID: string
}

const VERIFICATION_NUMBER_LENGTH = 3;

function ClaimAccount(props: Props) {

    let [mcInfo, setMcInfo] = useState<MinecraftConnectionInfo>();
    let [isLoggedIn, setIsLoggedIn] = useState(false);
    let [isLoading, setIsLoading] = useState(false);
    let [reloadMcInfoIntervalId, setReloadMcInfoIntervalId] = useState<number>();

    useEffect(() => {
        return () => {
            clearInterval(reloadMcInfoIntervalId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function onAfterLogin() {
        setIsLoading(true);
        loadMcInfo().then(() => {
            setIsLoading(false);
        })

        let id = window.setInterval(loadMcInfo, 30000)
        setReloadMcInfoIntervalId(id);
    }

    function loadMcInfo(): Promise<void> {
        return api.connectMinecraftAccount(props.playerUUID).then((mcInfo) => {
            setMcInfo(mcInfo);
            setIsLoggedIn(true);
            setIsLoading(false);
        });
    }

    function getFormattedVerificationNumber(): string {
        if (!mcInfo || mcInfo.code === undefined) {
            return "";
        }
        return String(mcInfo.code).padStart(VERIFICATION_NUMBER_LENGTH, '0')
    }

    let formattedVerificationNumber = getFormattedVerificationNumber();

    const whyText = <p>Connecting your Minecraft account allows us to improve your experience.
        There are a lot of features in development where we need to know what your Minecraft account is.
        Currently connecting your account only adds your Minecraft name to the link preview when you share your <Link href="/ref">referral link</Link>.
        Future features include tracking your profit from the flipper and hiding your history from others.</p>;

    return (
        <div className="claim-account">
            {
                isLoading ? getLoadingElement() : null
            }
            {
                !isLoading && isLoggedIn && mcInfo && !mcInfo.isConnected ?
                    <div>
                        <h3>How do I claim my Minecraft Account?</h3>
                        <p><p>To verify that this account is yours, please create a bid or an auction with the last 3 digits set to the number below. After at most 3 minutes your account will automatically be verified by our server. If your account hasn't been verified within 5 minutes please try again.</p></p>
                        <h4>Your number: <b style={{ color: "lime" }}>{formattedVerificationNumber}</b></h4>
                        <hr />
                        <h3>Example</h3>
                        <p>You can verify your account by one of these actions (examples):</p>
                        <ul>
                            <li>Bid <b>{formattedVerificationNumber}</b> coins on an auction</li>
                            <li>Bid 8.439.<b>{formattedVerificationNumber}</b> coins on an auction.</li>
                            <li>Create an auction for <b>{formattedVerificationNumber}</b> coins</li>
                            <li>Create an auction for 53.<b>{formattedVerificationNumber}</b> coins</li>
                            <li>. . .</li>
                        </ul>
                        <hr />
                        <h3>Why?</h3>
                        {whyText}
                    </div> : null
            }
            {
                !isLoading && isLoggedIn && mcInfo && mcInfo.isConnected ?
                    <div>
                        <h3>Your Account has been connected!</h3>
                        {whyText}
                    </div> : null
            }
            {
                !isLoading && !isLoggedIn ?
                    <div>
                        <p>To claim your Minecraft Account please log in with Google:</p>
                    </div> : null
            }
            <GoogleSignIn onAfterLogin={onAfterLogin} />
        </div >
    );
}

export default ClaimAccount;
