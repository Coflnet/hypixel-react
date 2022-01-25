import React, { useEffect, useState } from 'react';
import { ProSidebar, Menu, MenuItem, SidebarHeader } from 'react-pro-sidebar';
import 'react-pro-sidebar/dist/css/styles.css';
import { Build as BuildIcon, ShareOutlined as ShareIcon, NotificationsOutlined as NotificationIcon, Home as HomeIcon, Storefront as StorefrontIcon, AccountBalance as AccountBalanceIcon, Policy as PolicyIcon, Chat as ChatIcon, Menu as MenuIcon, ExploreOutlined as ExploreIcon } from '@material-ui/icons';
import { useForceUpdate } from '../../utils/Hooks';

let resizePromise: NodeJS.Timeout | null = null;

interface Props {
    hamburgerIconStyle?: React.CSSProperties
}

function NavBar(props: Props) {

    let [isWideOpen, setIsWideOpen] = useState(false);
    let [isHovering, setIsHovering] = useState(false);
    let forceUpdate = useForceUpdate();

    let isSmall = typeof document !== "undefined" ? document.body.clientWidth < 1500 : true;

    if (typeof window !== "undefined") {
        addResizeEventListener()
    }

    useEffect(() => {
        if (isWideOpen) {
            document.addEventListener('click', outsideClickHandler, true);
        } else {
            document.removeEventListener('click', outsideClickHandler, true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isWideOpen])

    function outsideClickHandler(evt) {
        const flyoutEl = document.getElementById("nav-bar");
        const hamburgerEl = document.getElementById("hamburger-icon");
        let targetEl = evt.target;

        do {
            if (targetEl === flyoutEl || targetEl === hamburgerEl) {
                return;
            }
            targetEl = (targetEl as any).parentNode;
        } while (targetEl);

        if (isWideOpen) {
            if (isSmall) {
                let el = document.getElementById('pro-sidebar');
                el?.classList.add('nav-closing');
                el?.classList.remove('nav-open');
                setTimeout(() => {
                    setIsWideOpen(false);
                    el?.classList.remove('nav-closing');
                }, 500)
            } else {
                setIsWideOpen(false);
            }
        }
    }

    function onMouseMove() {
        setIsHovering(true);
    }

    function onMouseOut() {
        setIsHovering(false);
    }

    function isCollapsed() {
        if (isSmall) {
            return false;
        }
        return !isWideOpen && !isHovering;
    }

    function addResizeEventListener() {
        window.addEventListener("resize", function (event) {
            if (resizePromise) {
                return;
            }
            resizePromise = setTimeout(() => {
                setIsWideOpen(false);
                forceUpdate();
                resizePromise = null;
                let el = document.getElementById('pro-sidebar');
                if (el) {
                    el.style.left = "0px";
                }
            }, 500)
        })
    }

    function isHidden() {
        return isSmall && !isWideOpen;
    }

    function onHamburgerClick() {
        if (isSmall && !isWideOpen) {
            let el = document.getElementById('pro-sidebar');
            if (el) {
                el.hidden = false;
                el.style.left = "-270px";
                setTimeout(() => {
                    if (el) {
                        el.classList.add('nav-open');
                    }
                });
                setTimeout(() => {
                    setIsWideOpen(true);
                }, 500)
            }
        } else {
            setIsWideOpen(!isWideOpen)
        }
    }

    let style = {
        position: "absolute",
        bottom: 0,
        zIndex: 100,
        left: 0,
        top: 0,
        minHeight: "100vh"
    } as React.CSSProperties

    return (
        <span>
            <aside onMouseMove={onMouseMove} onMouseOut={onMouseOut} id="nav-bar">
                <ProSidebar id="pro-sidebar" style={style} collapsed={isCollapsed()} hidden={isHidden()}>
                    <SidebarHeader>
                        <div style={{ padding: "24px", fontWeight: "bold", fontSize: "20px", letterSpacing: "1px", overflow: "hidden", whiteSpace: "nowrap" }}><ExploreIcon /> {!isCollapsed() ? "Navigation" : ""}</div>
                    </SidebarHeader>
                    <Menu iconShape="square">
                        <MenuItem icon={<HomeIcon />}>Home</MenuItem>
                        <MenuItem icon={<StorefrontIcon />}>Item-Flipper</MenuItem>
                        <MenuItem icon={<NotificationIcon />}></MenuItem>
                        <MenuItem icon={<BuildIcon />}>Profitable crafts</MenuItem>
                        <MenuItem icon={<AccountBalanceIcon />}>Premium</MenuItem>
                        <MenuItem icon={<ShareIcon />}>Referral</MenuItem>
                        <MenuItem icon={<PolicyIcon />}>Links / Legal</MenuItem>
                        <MenuItem icon={<ChatIcon />}>Feedback</MenuItem>
                        <MenuItem icon={<img src="/discord_icon.svg" alt="" height="24px"></img>}><a href="https://discord.gg/wvKXfTgCfb"><div style={{ color: "#7289da" }}>Discord</div></a></MenuItem>
                    </Menu>
                </ProSidebar>
            </aside>
            {isSmall ? <span onClick={onHamburgerClick} id="hamburger-icon" style={props.hamburgerIconStyle}>
                <MenuIcon fontSize="large" />
            </span> : ""}
        </span>
    );
}

export default NavBar;
