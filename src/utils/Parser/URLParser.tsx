export function parseEnchantmentFilter(enchantmentFilterBase64: string): EnchantmentFilter | undefined {
    let enchantmentFilter: any = JSON.parse(atob(enchantmentFilterBase64));
    if (enchantmentFilter.enchantment === undefined || enchantmentFilter.enchantment.id === undefined || enchantmentFilter.level === undefined) {
        return undefined;
    }
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