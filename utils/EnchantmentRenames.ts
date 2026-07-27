const renamedEnchantments: Record<string, { currentName: string; previousName: string }> = {
    AIMING: { currentName: 'Dragon Tracer', previousName: 'Aiming' },
    ARCANE: { currentName: 'Woodsplitter', previousName: 'Arcane' },
    DRAGON_HUNTER: { currentName: 'Gravity', previousName: 'Dragon Hunter' },
    FEROCIOUS_MANA: { currentName: 'Vivacious Vitality', previousName: 'Ferocious Mana' },
    HARDENED_MANA: { currentName: 'Hardened Vitality', previousName: 'Hardened Mana' },
    MAGMARIZER: { currentName: 'Pyroclasm', previousName: 'Magmarizer' },
    MANA_VAMPIRE: { currentName: 'Vampiric Vitality', previousName: 'Mana Vampire' },
    PRISTINE: { currentName: 'Prismatic', previousName: 'Pristine' },
    STRONG_MANA: { currentName: 'Strong Vitality', previousName: 'Strong Mana' },
    SYPHON: { currentName: 'Drain', previousName: 'Syphon' },
    TURBO_COCO: { currentName: 'Turbo-Cocoa', previousName: 'Turbo-Coco' }
}

export function getEnchantmentRename(tag: string) {
    const match = tag.toUpperCase().match(/^ENCHANTMENT_(.+)_(\d+)$/)
    const rename = match && renamedEnchantments[match[1]]
    return rename ? { ...rename, level: match[2] } : undefined
}
