'use client'
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
import Image from 'next/image'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { Menu, MenuItem, Sidebar } from 'react-pro-sidebar'
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
    let [collapsed, setCollapsed] = useState(true)
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

        return () => {
            document.removeEventListener('click', outsideClickHandler, true)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isWideOpen])

    useEffect(() => {
        setCollapsed(isCollapsed())
    }, [isSmall, isWideOpen, isHovering])

    function isCollapsed() {
        if (isSmall) {
            return false
        }
        return !isWideOpen && !isHovering
    }

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

    return (
        <span>
            <aside className={styles.navBar} id="navBar" onMouseEnter={onMouseMove} onMouseLeave={onMouseOut}>
                <Sidebar id="pro-sidebar" hidden={isSmall && !isWideOpen} backgroundColor="#1d1d1d" collapsed={collapsed}>
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <div>
                            <div className={styles.logo}>
                                <Image src="/logo512.png" alt="Logo" width={40} height={40} style={{ translate: '-5px' }} /> {!isCollapsed() ? 'Coflnet' : ''}
                            </div>
                        </div>
                        <hr />
                        <Menu>
                            <MenuItem className={styles.menuItem} component={<Link href={'/'} />} icon={<HomeIcon />}>
                                Home
                            </MenuItem>
                            <MenuItem className={styles.menuItem} component={<Link href={'/flipper'} />} icon={<StorefrontIcon />}>
                                Item Flipper
                            </MenuItem>
                            <MenuItem className={styles.menuItem} component={<Link href={'/account'} />} icon={<AccountIcon />}>
                                Account
                            </MenuItem>
                            <MenuItem className={styles.menuItem} component={<Link href={'/subscriptions'} />} icon={<NotificationIcon />}>
                                Notifier
                            </MenuItem>
                            <MenuItem className={styles.menuItem} component={<Link href={'/crafts'} />} icon={<BuildIcon />}>
                                Profitable Crafts
                            </MenuItem>
                            <MenuItem className={styles.menuItem} component={<Link href={'/premium'} />} icon={<AccountBalanceIcon />}>
                                Premium / Shop
                            </MenuItem>
                            <MenuItem className={styles.menuItem} component={<Link href={'/kat'} />} icon={<PetsIcon />}>
                                Kat Flips
                            </MenuItem>
                            <MenuItem className={styles.menuItem} component={<Link href={'/mod'} />} icon={<DownloadIcon />}>
                                Mod
                            </MenuItem>
                            <MenuItem className={styles.menuItem} component={<Link href={'/ref'} />} icon={<ShareIcon />}>
                                Referral
                            </MenuItem>
                            <MenuItem className={styles.menuItem} component={<Link href={'/about'} />} icon={<PolicyIcon />}>
                                Links / Legal
                            </MenuItem>
                            <MenuItem className={styles.menuItem} component={<Link href={'/feedback'} />} icon={<ChatIcon />}>
                                Feedback
                            </MenuItem>
                            <MenuItem
                                className={styles.menuItem}
                                component={<Link href={'https://discord.gg/wvKXfTgCfb'} target="_blank" />}
                                rel="noreferrer"
                                icon={<Image src="/discord_icon.svg" alt="Discord icon" height={24} width={32} />}
                            >
                                Discord
                            </MenuItem>
                        </Menu>
                    </div>
                </Sidebar>
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
