export function parseEnchantmentFilter(enchantmentFilterBase64: string): EnchantmentFilter {
    let enchantmentFilter: any = JSON.parse(atob(enchantmentFilterBase64));
    return {
        enchantment: {
            id: enchantmentFilter.enchantment.id,
        },
        level: enchantmentFilter.level
    }
}
export function getEnchantmentFilterFromUrl(query: URLSearchParams): EnchantmentFilter | undefined {
    let enchantmentFilterBase64 = query.get("enchantmentFilter")
    if (enchantmentFilterBase64) {
        return parseEnchantmentFilter(enchantmentFilterBase64);
    }
}