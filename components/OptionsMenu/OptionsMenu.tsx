'use client'
import React from 'react'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import styles from './OptionsMenu.module.css'
import { Button, Dropdown, DropdownButton } from 'react-bootstrap'

interface Props {
    selected?: Player | Item
}
interface AvailableLinks {
    title: string
    url: string
}

const CustomToggle = React.forwardRef(({ children, onClick }: any, ref) => (
    <span
        ref={ref as any}
        onClick={e => {
            e.preventDefault()
            onClick(e)
        }}
    >
        {children}
        <MoreVertIcon />
    </span>
))

function OptionsMenu(props: Props) {
    let available: AvailableLinks[] = []
    const isItemPage = (props.selected as Item)?.tag !== undefined
    const isPlayerPage = !isItemPage
    if (isItemPage) {
        let name = props.selected?.name
        let tag = (props.selected as Item).tag
        available.push({ title: 'Fandom', url: 'https://hypixel-skyblock.fandom.com/wiki/' + name })
        available.push({ title: 'Wiki', url: 'https://wiki.hypixel.net/' + name })
        if ((props.selected as Item).bazaar) {
            available.push({ title: 'Skyblock.bz', url: 'https://Skyblock.bz/product/' + tag })
        }
    } else if (isPlayerPage) {
        let player = props.selected as Player
        available.push({ title: 'SkyCrypt', url: 'https://sky.shiiyu.moe//stats/' + player?.uuid })
        available.push({ title: 'Plancke', url: 'https://plancke.io/hypixel/player/stats/' + player?.uuid })
    }

    const navigate = (url: string) => {
        window.open(url, '_blank')
    }

    if (!props.selected || props.selected.name === undefined) {
        return null
    }

    return (
        <div className={styles.optionsMenu}>
            <div className={styles.buttonsWrapper}>
                {available.map((result, i) => (
                    <a key={i} href={result.url} title={result.title} target="_blank" rel="noreferrer">
                        <Button>{result.title}</Button>
                    </a>
                ))}
            </div>

            <Dropdown className={styles.dropdown}>
                <Dropdown.Toggle as={CustomToggle}></Dropdown.Toggle>
                <Dropdown.Menu id="dropdownMenuButton">
                    {available.map((result, i) => (
                        <Dropdown.Item
                            key={result.url}
                            onClick={() => {
                                navigate(result.url)
                            }}
                        >
                            {result.title}
                        </Dropdown.Item>
                    ))}
                </Dropdown.Menu>
            </Dropdown>
        </div>
    )
}

export default OptionsMenu
