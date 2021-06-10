import React, { useState } from 'react';
import './NavBar.css';
import SideNav from 'react-simple-sidenav';
import { Link } from 'react-router-dom';
import { useMatomo } from '@datapunt/matomo-tracker-react';
import { NotificationsOutlined as NotificationIcon, TrendingUp as TrendIcon, Storefront as StorefrontIcon, AccountBalance as AccountBalanceIcon, Policy as PolicyIcon, Chat as ChatIcon, Menu as MenuIcon } from '@material-ui/icons';

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
                        <Link to="/"><div className="link-item-div"><TrendIcon className="navbar-icon" />Prices</div></Link>,
                        <Link to="/flipper"><div className="link-item-div"><StorefrontIcon className="navbar-icon" />Item-Flipper</div></Link>,
                        <Link to="/subscriptions"><div className="link-item-div"><NotificationIcon className="navbar-icon" />Subscriptions</div></Link>,
                        <Link to="/premium"><div className="link-item-div"><AccountBalanceIcon className="navbar-icon" />Premium</div></Link>,
                        <Link to="/about"><div className="link-item-div"><PolicyIcon className="navbar-icon" />Links / Legal</div></Link>,
                        <Link to="/feedback"><div className="link-item-div"><ChatIcon className="navbar-icon" />Feedback</div></Link>]}
                    onHideNav={() => { setShowNav(false) }
                    }>
                </SideNav >
            </div>
            <span onClick={() => { setShowNav(true); trackEvent({ category: "informations", action: "open" }) }} className="infoIcon">
                <MenuIcon fontSize="large" />
            </span>
        </span >
    );
}

export default NavBar;
