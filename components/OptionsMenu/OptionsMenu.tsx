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
        let fandomName = props.selected?.name
        let wikiName = props.selected?.name
        let tag = (props.selected as Item).tag
        if (tag.startsWith('ENCHANTMENT_')) {
            fandomName = tag.replace('ENCHANTMENT_', '').replace('ULTIMATE_', '').replace(/_\d/, '').toLowerCase()
            fandomName = fandomName
                .split('_')
                .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
                .join('_')
            wikiName = fandomName + '_Enchantment'
        }
        available.push({ title: 'Fandom', url: 'https://hypixel-skyblock.fandom.com/wiki/' + fandomName })
        available.push({ title: 'Wiki', url: 'https://wiki.hypixel.net/' + wikiName })
        if ((props.selected as Item).bazaar) {
            available.push({ title: 'Skyblock.finance', url: 'https://Skyblock.finance/items/' + tag })
        }
    } else if (isPlayerPage) {
        let player = props.selected as Player
        available.push({ title: 'SkyCrypt', url: 'https://sky.shiiyu.moe/stats/' + player?.uuid })
        available.push({ title: 'Plancke', url: 'https://plancke.io/hypixel/player/stats/' + player?.name })
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
