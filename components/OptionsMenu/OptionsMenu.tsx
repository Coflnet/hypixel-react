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
    <button
        ref={ref as any}
        onClick={e => {
            e.preventDefault()
            onClick(e)
        }}
        type="button"
        aria-label="Options"
        className={styles.toggleButton}
    >
        {children}
        <MoreVertIcon />
    </button>
))
CustomToggle.displayName = 'CustomToggle'

function OptionsMenu(props: Props) {
    let available: AvailableLinks[] = []
    const isItemPage = (props.selected as Item)?.tag !== undefined
    const isPlayerPage = !isItemPage
    if (isItemPage) {
        let tag = (props.selected as Item).tag
        let fandomName = (props.selected as Item).name ?? tag
        let wikiName = (props.selected as Item).name ?? tag
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
            available.push({ title: 'Bazaartracker', url: 'https://bazaartracker.com/product/' + tag.toLowerCase() })
            available.push({ title: 'BzMeta', url: 'https://skyblock.bz/product/' + tag.toLowerCase() })
        }
    } else if (isPlayerPage) {
        let player = props.selected as Player
        available.push({ title: 'SkyCrypt', url: 'https://sky.shiiyu.moe/stats/' + player?.uuid })
        available.push({ title: 'Plancke', url: 'https://plancke.io/hypixel/player/stats/' + player?.name })
    }

    const navigate = (url: string) => {
        window.open(url, '_blank')
    }

    // Render if we have either a player name or an item tag (item pages may only have tag during SSG)
    if (!props.selected) {
        return null
    }

    const selectedAsItem = props.selected as Item
    const selectedAsPlayer = props.selected as Player

    const hasItemTag = selectedAsItem?.tag !== undefined && selectedAsItem?.tag !== null
    const hasPlayerName = selectedAsPlayer?.name !== undefined && selectedAsPlayer?.name !== null

    if (!hasItemTag && !hasPlayerName) {
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
