import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import AccountIcon from '@mui/icons-material/AccountCircle'
import BuildIcon from '@mui/icons-material/Build'
import ChatIcon from '@mui/icons-material/Chat'
import DownloadIcon from '@mui/icons-material/Download'
import HomeIcon from '@mui/icons-material/Home'
import MenuIcon from '@mui/icons-material/Menu'
import NotificationIcon from '@mui/icons-material/NotificationsOutlined'
import PetsIcon from '@mui/icons-material/PetsOutlined'
import PolicyIcon from '@mui/icons-material/Policy'
import ShareIcon from '@mui/icons-material/ShareOutlined'
import StorefrontIcon from '@mui/icons-material/Storefront'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { Menu, MenuItem, ProSidebar, SidebarHeader } from 'react-pro-sidebar'
import 'react-pro-sidebar/dist/css/styles.css'
import { useForceUpdate } from '../../utils/Hooks'
import styles from './NavBar.module.css'

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

        setIsSmall(document.body.clientWidth < 1500)

        window.addEventListener('resize', resizeHandler)

        return () => {
            window.removeEventListener('resize', resizeHandler)
        }
    }, [])

    useEffect(() => {
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
            <aside className={styles.navBar} id="navBar" onMouseEnter={onMouseMove} onMouseLeave={onMouseOut}>
                <ProSidebar id="pro-sidebar" style={style} collapsed={isCollapsed()} hidden={isHidden()}>
                    <SidebarHeader>
                        <div
                            style={{
                                padding: '24px',
                                fontWeight: 'bold',
                                fontSize: '20px',
                                letterSpacing: '1px',
                                overflow: 'hidden',
                                whiteSpace: 'nowrap',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            <img src="/logo512.png" alt="Logo" width={'40px'} height={'40px'} style={{ translate: '-5px' }} /> {!isCollapsed() ? 'Coflnet' : ''}
                        </div>
                    </SidebarHeader>
                    <Menu iconShape="square">
                        <MenuItem className="disableLinkStyle" icon={<HomeIcon />}>
                            <Link href={'/'}>Home</Link>
                        </MenuItem>
                        <MenuItem icon={<StorefrontIcon />}>
                            <Link href={'/flipper'}>Item Flipper</Link>
                        </MenuItem>
                        <MenuItem icon={<AccountIcon />}>
                            <Link href={'/account'}>Account</Link>
                        </MenuItem>
                        <MenuItem icon={<NotificationIcon />}>
                            <Link href={'/subscriptions'}>Notifier</Link>
                        </MenuItem>
                        <MenuItem icon={<BuildIcon />}>
                            <Link href={'/crafts'}>Profitable Crafts</Link>
                        </MenuItem>
                        <MenuItem icon={<AccountBalanceIcon />}>
                            <Link href={'/premium'}>Premium / Shop</Link>
                        </MenuItem>
                        <MenuItem icon={<PetsIcon />}>
                            <Link href={'/kat'}>Kat Flips</Link>
                        </MenuItem>
                        <MenuItem icon={<DownloadIcon />}>
                            <Link href={'/mod'}>Mod</Link>
                        </MenuItem>
                        <MenuItem className="disableLinkStyle" icon={<ShareIcon />}>
                            <Link href={'/ref'}>Referral</Link>
                        </MenuItem>
                        <MenuItem icon={<PolicyIcon />}>
                            <Link href={'/about'}>Links / Legal</Link>
                        </MenuItem>
                        <MenuItem icon={<ChatIcon />}>
                            <Link href={'/feedback'}>Feedback</Link>
                        </MenuItem>
                        <MenuItem icon={<img src="/discord_icon.svg" alt="Discord icon" height="24" />}>
                            <a target="_blank" rel="noreferrer" href="https://discord.gg/wvKXfTgCfb">
                                Discord
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
