import React, { useState } from 'react';
import './NavBar.css';
import SideNav from 'react-simple-sidenav';
import { Link } from 'react-router-dom';
import { useMatomo } from '@datapunt/matomo-tracker-react';

function NavBar() {

    let { trackEvent } = useMatomo();
    let [showNav, setShowNav] = useState(false);

    const titleStyle = {
        backgroundColor: '#7a8288',
        height: "60px",
        margin: "auto",
        padding: "0 20px",
        lineHeight: "60px",
        fontSize: "22px"
    };

    const navStyle = {
        width: "60%",
        background: "#3a3f44" 
    }

    const itemStyle = {
        padding: "22px 0px",
        listStyleType: "none",
        background: "#3a3f44"
    }

    const itemHoverStyle = {
        background: "#272b30"
    }

    return (
        <span>
            <div className="nav-bar">
                <SideNav showNav={showNav}
                    titleStyle={titleStyle}
                    navStyle={navStyle}
                    itemStyle={itemStyle}
                    itemHoverStyle={itemHoverStyle}
                    title={<span>Navigation</span>}
                    items={[
                        <Link to="/"><div className="link-item-div"><img src="/Coin.png" height="48" width="48" alt="prices icon" loading="lazy" />Prices</div></Link>,
                        <Link to="/flipper"><div className="link-item-div"><img src="/Coin.png" height="48" width="48" alt="premium icon" loading="lazy" />Item-Flipper</div></Link>,
                        <Link to="/subscriptions"><div className="link-item-div"><img src="/Coin.png" height="48" width="48" alt="subscription icon" loading="lazy" />Subscriptions</div></Link>,
                        <Link to="/premium"><div className="link-item-div"><img src="/Coin.png" height="48" width="48" alt="premium icon" loading="lazy" />Premium</div></Link>,
                        <Link to="/about"><div className="link-item-div"><img src="/Coin.png" height="48" width="48" alt="legal icon" loading="lazy" />Links / Legal</div></Link>,
                        <Link to="/feedback"><div className="link-item-div"><img src="/Coin.png" height="48" width="48" alt="feedback icon" loading="lazy" />Feedback</div></Link>]}
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
