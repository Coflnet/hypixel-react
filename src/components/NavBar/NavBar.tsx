import React, { useState } from 'react';
import './NavBar.css';
import SideNav from 'react-simple-sidenav';
import { Link } from 'react-router-dom';
import { useMatomo } from '@datapunt/matomo-tracker-react';

function NavBar() {

    let { trackEvent } = useMatomo();
    let [showNav, setShowNav] = useState(false);

    return (
        <span>
            <div className="nav-bar">
                <SideNav showNav={showNav}
                    titleStyle={{ backgroundColor: "#22A7F0", height: "60px", margin: "auto", padding: "0 20px", lineHeight: "60px", fontSize: "22px" }}
                    navStyle={{ width: "60%" }}
                    itemStyle={{ padding: "22px 0px", listStyleType: "none" }}
                    title={<span>Navigation</span>}
                    items={[
                        <Link to="/"><div className="link-item-div"><img src="/Coin.png" height="48" width="48" alt="" />Prices</div></Link>,
                        <Link to="/subscriptions"><div className="link-item-div"><img src="/Coin.png" height="48" width="48" alt="" />Subscriptions</div></Link>,
                        <Link to="/premium"><div className="link-item-div"><img src="/Coin.png" height="48" width="48" alt="" />Premium</div></Link>,
                        <Link to="/about"><div className="link-item-div"><img src="/Coin.png" height="48" width="48" alt="" />Links / Legal</div></Link>,
                        <Link to="/feedback"><div className="link-item-div"><img src="/Coin.png" height="48" width="48" alt="" />Feedback</div></Link>]}
                    onHideNav={() => { setShowNav(false) }
                    }>
                </SideNav >
            </div>
            <span onClick={() => { setShowNav(true); trackEvent({ category: "informations", action: "open" }) }} className="infoIcon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-list" viewBox="0 0 16 16">
                    <path fillRule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z" />
                </svg>
            </span>
        </span >
    );
}

export default NavBar;
