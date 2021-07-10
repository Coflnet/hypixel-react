import React from 'react';
import './NavBar.css';
import { ProSidebar, Menu, MenuItem } from 'react-pro-sidebar';
import 'react-pro-sidebar/dist/css/styles.css';
import { Link } from 'react-router-dom';
import { NotificationsOutlined as NotificationIcon, Home as HomeIcon, Storefront as StorefrontIcon, AccountBalance as AccountBalanceIcon, Policy as PolicyIcon, Chat as ChatIcon, Menu as MenuIcon, Headset as HeadsetIcon } from '@material-ui/icons';

function NavBar() {

    /**
     *                 <SideNav showNav={showNav}
                    titleStyle={titleStyle}
                    navStyle={navStyle}
                    itemStyle={itemStyle}
                    itemHoverStyle={itemHoverStyle}
                    title={<span>Navigation</span>}
                    items={[
                        <Link to="/"><div className="link-item-div"><HomeIcon className="navbar-icon" />Home</div></Link>,
                        <Link to="/flipper"><div className="link-item-div"><StorefrontIcon className="navbar-icon" />Item-Flipper</div></Link>,
                        <Link to="/subscriptions"><div className="link-item-div"><NotificationIcon className="navbar-icon" />Subscriptions</div></Link>,
                        <Link to="/premium"><div className="link-item-div"><AccountBalanceIcon className="navbar-icon" />Premium</div></Link>,
                        <Link to="/about"><div className="link-item-div"><PolicyIcon className="navbar-icon" />Links / Legal</div></Link>,
                        <Link to="/feedback"><div className="link-item-div"><ChatIcon className="navbar-icon" />Feedback</div></Link>,
                        <a href="https://discord.gg/Qm55WEkgu6"><div style={{ color: "#7289da" }} className="link-item-div"><HeadsetIcon className="navbar-icon" />Discord</div></a>]}
                    onHideNav={() => { setShowNav(false) }
                    }>
                </SideNav >
     */

    return (
        <ProSidebar collapsed={true}>
            <Menu iconShape="square">
                <MenuItem icon={<HomeIcon />}>Home<Link to="/" /></MenuItem>
                <MenuItem icon={<StorefrontIcon />}><Link to="/flipper">Item-Flipper</Link> </MenuItem>
                <MenuItem icon={<NotificationIcon />}><Link to="/subscriptions" >Subscriptions</Link></MenuItem>
                <MenuItem icon={<AccountBalanceIcon />}><Link to="/premium" >Premium</Link></MenuItem>
                <MenuItem icon={<PolicyIcon />}><Link to="/about" >Links / Legal</Link></MenuItem>
                <MenuItem icon={<ChatIcon />}><Link to="/feedback" >Feedback</Link></MenuItem>
                <MenuItem icon={<HeadsetIcon />}><a href="https://discord.gg/Qm55WEkgu6"><div style={{ color: "#7289da" }} className="link-item-div">Discord</div></a></MenuItem>
            </Menu>
        </ProSidebar>
    );
}

export default NavBar;
