import React, { useEffect, useState } from 'react'
import { ProSidebar, Menu, MenuItem, SidebarHeader } from 'react-pro-sidebar'
import 'react-pro-sidebar/dist/css/styles.css'
import {
    Build as BuildIcon,
    ShareOutlined as ShareIcon,
    NotificationsOutlined as NotificationIcon,
    Home as HomeIcon,
    Storefront as StorefrontIcon,
    AccountBalance as AccountBalanceIcon,
    Policy as PolicyIcon,
    Chat as ChatIcon,
    Menu as MenuIcon,
    ExploreOutlined as ExploreIcon,
    PetsOutlined as PetsIcon
} from '@mui/icons-material'
import { useForceUpdate } from '../../utils/Hooks'
import styles from './NavBar.module.css'
import { isClientSideRendering } from '../../utils/SSRUtils'
import Link from 'next/link'

let resizePromise: NodeJS.Timeout | null = null

interface Props {
    hamburgerIconStyle?: React.CSSProperties
}

function NavBar(props: Props) {
    let [isWideOpen, setIsWideOpen] = useState(false)
    let [isHovering, setIsHovering] = useState(false)
    let [isSmall, setIsSmall] = useState(true)
    let forceUpdate = useForceUpdate()

    useEffect(() => {
        if (!isClientSideRendering()) {
            return
        }

        setIsSmall(document.body.clientWidth < 1500)

        window.addEventListener('resize', resizeHandler)

        return () => {
            if (!isClientSideRendering()) {
                return
            }
            window.removeEventListener('resize', resizeHandler)
        }
    }, [])

    useEffect(() => {
        if (!isClientSideRendering()) {
            return
        }
        if (isWideOpen) {
            document.addEventListener('click', outsideClickHandler, true)
        } else {
            document.removeEventListener('click', outsideClickHandler, true)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isWideOpen])

    function outsideClickHandler(evt) {
        const flyoutEl = document.getElementById('navBar')
        const hamburgerEl = document.getElementById('hamburgerIcon')
        let targetEl = evt.target

        do {
            if (targetEl === flyoutEl || targetEl === hamburgerEl) {
                return
            }
            targetEl = (targetEl as any).parentNode
        } while (targetEl)

        if (isWideOpen) {
            if (isSmall) {
                let el = document.getElementById('pro-sidebar')
                el?.classList.add(styles.navClosing)
                el?.classList.remove(styles.navOpen)
                setTimeout(() => {
                    setIsWideOpen(false)
                    el?.classList.remove(styles.navClosing)
                }, 500)
            } else {
                setIsWideOpen(false)
            }
        }
    }

    function onMouseMove() {
        setIsHovering(true)
    }

    function onMouseOut() {
        setIsHovering(false)
    }

    function isCollapsed() {
        if (isSmall) {
            return false
        }
        return !isWideOpen && !isHovering
    }

    function resizeHandler() {
        if (resizePromise) {
            return
        }
        resizePromise = setTimeout(() => {
            setIsWideOpen(false)
            setIsSmall(document.body.clientWidth < 1500)
            forceUpdate()
            resizePromise = null
            let el = document.getElementById('pro-sidebar')
            if (el) {
                el.style.left = '0px'
            }
        }, 500)
    }

    function isHidden() {
        return isSmall && !isWideOpen
    }

    function onHamburgerClick() {
        if (isSmall && !isWideOpen) {
            let el = document.getElementById('pro-sidebar')
            if (el) {
                el.hidden = false
                el.style.left = '-270px'
                setTimeout(() => {
                    if (el) {
                        el.classList.add(styles.navOpen)
                    }
                })
                setTimeout(() => {
                    setIsWideOpen(true)
                }, 500)
            }
        } else {
            setIsWideOpen(!isWideOpen)
        }
    }

    let style = {
        position: 'absolute',
        bottom: 0,
        zIndex: 100,
        left: 0,
        top: 0,
        minHeight: '100vh'
    } as React.CSSProperties

    return (
        <span>
            <aside onMouseMove={onMouseMove} onMouseOut={onMouseOut} className={styles.navBar} id="navBar">
                <ProSidebar id="pro-sidebar" style={style} collapsed={isCollapsed()} hidden={isHidden()}>
                    <SidebarHeader>
                        <div style={{ padding: '24px', fontWeight: 'bold', fontSize: '20px', letterSpacing: '1px', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            <ExploreIcon /> {!isCollapsed() ? 'Navigation' : ''}
                        </div>
                    </SidebarHeader>
                    <Menu iconShape="square">
                        <MenuItem className="disableLinkStyle" icon={<HomeIcon />}>
                            <Link href={'/'}>Home</Link>
                        </MenuItem>
                        <MenuItem className="disableLinkStyle" icon={<StorefrontIcon />}>
                            <Link href={'/flipper'}>Item-Flipper</Link>
                        </MenuItem>
                        <MenuItem className="disableLinkStyle" icon={<NotificationIcon />}>
                            <Link href={'/subscriptions'}>Notifier</Link>
                        </MenuItem>
                        <MenuItem className="disableLinkStyle" icon={<BuildIcon />}>
                            <Link href={'/crafts'}>Profitable crafts</Link>
                        </MenuItem>
                        <MenuItem className="disableLinkStyle" icon={<PetsIcon />}>
                            <Link href={'/kat'}>Kat flips</Link>
                        </MenuItem>
                        <MenuItem className="disableLinkStyle" icon={<AccountBalanceIcon />}>
                            <Link href={'/premium'}>Premium</Link>
                        </MenuItem>
                        <MenuItem className="disableLinkStyle" icon={<ShareIcon />}>
                            <Link href={'/ref'}>Referral</Link>
                        </MenuItem>
                        <MenuItem className="disableLinkStyle" icon={<PolicyIcon />}>
                            <Link href={'/about'}>Links / Legal</Link>
                        </MenuItem>
                        <MenuItem className="disableLinkStyle" icon={<ChatIcon />}>
                            <Link href={'/feedback'}>Feedback</Link>
                        </MenuItem>
                        <MenuItem className="disableLinkStyle" icon={<img src="/discord_icon.svg" alt="" height="24"></img>}>
                            <a href="https://discord.gg/wvKXfTgCfb">
                                <div style={{ color: '#7289da' }}>Discord</div>
                            </a>
                        </MenuItem>
                    </Menu>
                </ProSidebar>
            </aside>
            {isSmall ? (
                <span onClick={onHamburgerClick} className={styles.hamburgerIcon} id="hamburgerIcon" style={props.hamburgerIconStyle}>
                    <MenuIcon fontSize="large" />
                </span>
            ) : (
                ''
            )}
        </span>
    )
}

export default NavBar
