export function parseEnchantmentFilter(enchantmentFilterBase64: string): EnchantmentFilter {
    let enchantmentFilter: any = JSON.parse(atob(enchantmentFilterBase64));
    return {
        enchantment: {
            id: enchantmentFilter.enchantment.id,
        },
        level: enchantmentFilter.level
    }
}