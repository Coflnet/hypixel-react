'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import styles from './OptionsMenu.module.css'
import { Button, Dropdown, DropdownButton } from 'react-bootstrap'
import BazaarExportModal from '../BazaarExportModal/BazaarExportModal'
import { convertTagToName } from '../../utils/Formatter'
import { buildArchiveUrl } from '../../utils/Parser/URLParser'
import { useItemFilterFromUrl } from '../../hooks/useItemFilterFromUrl'

interface Props {
    selected?: Player | Item
}
interface AvailableLinks {
    title: string
    url: string
    /** Tooltip/title text if it differs from the visible `title` label. */
    tooltip?: string
    /** Same-tab next/link navigation instead of opening an external site in a new tab. */
    internal?: boolean
}

const minecraftWikiEnchantmentTitleOverrides: Record<string, string> = {
    Bank: 'Bank_(Enchantment)',
    Blessing: 'Blessing_(Enchantment)',
    Experience: 'Experience_(Enchantment)',
    Great_Spook: 'Great_Spook_(Enchantment)',
    Green_Thumb: 'Green_Thumb_(Enchantment)',
    Knockback: 'Knockback_(Enchantment)',
    Toxophilite: 'Toxophilite_(Enchantment)',
    Wisdom: 'Wisdom_(Enchantment)'
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

function formatWikiPageTitle(title: string) {
    return title.trim().replace(/\s+/g, '_')
}

function getEnchantmentWikiBaseTitle(tag: string) {
    return tag
        .replace(/^ENCHANTMENT_/, '')
        .replace(/_\d+$/, '')
        .toLowerCase()
        .split('_')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join('_')
}

function getItemTitle(item: Item) {
    return item.name?.trim() || convertTagToName(item.tag)
}

function getMinecraftWikiTitle(item: Item) {
    if (item.tag.startsWith('ENCHANTMENT_')) {
        const enchantmentTitle = getEnchantmentWikiBaseTitle(item.tag)
        return minecraftWikiEnchantmentTitleOverrides[enchantmentTitle] ?? enchantmentTitle
    }

    return formatWikiPageTitle(getItemTitle(item))
}

function OptionsMenu(props: Props) {
    let available: AvailableLinks[] = []
    let [showExportModal, setShowExportModal] = useState(false)
    // Reactively tracks the URL's item filter (see hooks/useItemFilterFromUrl) so the Archive link
    // stays in sync as the user changes filters on the page, not just what was there at mount time.
    // SSR/first paint sees `{}` (no window yet), matching every other client-only URL read here.
    let itemFilter = useItemFilterFromUrl()

    const isItemPage = (props.selected as Item)?.tag !== undefined
    const isPlayerPage = !isItemPage
    const isBazaarItem = isItemPage && (props.selected as Item).bazaar
    if (isItemPage) {
        const selectedItem = props.selected as Item
        const tag = selectedItem.tag
        available.push({ title: 'Wiki', url: 'https://hypixelskyblock.minecraft.wiki/w/' + getMinecraftWikiTitle(selectedItem) })
        if ((props.selected as Item).bazaar) {
            available.push({ title: 'Bazaartracker', url: 'https://bazaartracker.com/product/' + tag.toLowerCase() })
            available.push({ title: 'BzMeta', url: 'https://skyblock.bz/product/' + tag.toLowerCase() })
        } else {
            available.push({ title: 'Archive', url: buildArchiveUrl(tag, itemFilter), tooltip: 'Query archived auctions', internal: true })
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
                {available.map((result, i) =>
                    result.internal ? (
                        <Link key={i} href={result.url} title={result.tooltip ?? result.title}>
                            <Button>{result.title}</Button>
                        </Link>
                    ) : (
                        <a key={i} href={result.url} title={result.tooltip ?? result.title} target="_blank" rel="noreferrer">
                            <Button>{result.title}</Button>
                        </a>
                    )
                )}
                {isBazaarItem && (
                    <Button variant="secondary" onClick={() => setShowExportModal(true)} style={{ marginLeft: 5 }}>
                        Export
                    </Button>
                )}
            </div>

            <Dropdown className={styles.dropdown}>
                <Dropdown.Toggle as={CustomToggle}></Dropdown.Toggle>
                <Dropdown.Menu id="dropdownMenuButton">
                    {available.map(result =>
                        result.internal ? (
                            <Dropdown.Item as={Link} key={result.url} href={result.url} title={result.tooltip ?? result.title}>
                                {result.title}
                            </Dropdown.Item>
                        ) : (
                            <Dropdown.Item
                                key={result.url}
                                title={result.tooltip ?? result.title}
                                onClick={() => {
                                    navigate(result.url)
                                }}
                            >
                                {result.title}
                            </Dropdown.Item>
                        )
                    )}
                    {isBazaarItem && (
                        <Dropdown.Item onClick={() => setShowExportModal(true)}>Export</Dropdown.Item>
                    )}
                </Dropdown.Menu>
            </Dropdown>

            {isBazaarItem && showExportModal && (
                <BazaarExportModal show={showExportModal} onHide={() => setShowExportModal(false)} itemTag={(props.selected as Item).tag} />
            )}
        </div>
    )
}

export default OptionsMenu
