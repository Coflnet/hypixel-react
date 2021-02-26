/*
 Returns a given number as string with thousands-seperators. Example:
 1234567 => 1.234.567

 Default-Seperator: '.'
*/

import { CSSProperties } from "react";

export function numberWithThousandsSeperators(number?: number, seperator?: string): string {
    if (!number) {
        return "0";
    }
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, seperator || ".");
}

/**
 * Converts a tag (e.g. WOODEN_AXE) to a item name (e.g. Wooden Axe)
 * - replaces all _ with spaces
 * - lowercases the word exept first letter (with exception of the defined words)
 * @param item 
 */
export function convertTagToName(itemTag?: string): string {

    if (!itemTag) {
        return "";
    }

    // words that should remain lowercase
    const exceptions = ["of", "the"];

    function capitalizeWords(text: string): string {
        return text.replace(/\w\S*/g, function (txt) {
            if (exceptions.findIndex(a => a === txt) > -1) {
                return txt;
            }
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
    }

    let formatted: string = itemTag.replace(new RegExp("_", "g"), " ").toLowerCase();
    formatted = capitalizeWords(formatted);
    return formatted;
}

export function getStyleForTier(tier?: string): CSSProperties {

    const DEFAULT_COLOR = "black";
    enum TIER_COLORS {
        COMMON = "black",
        UNCOMMON = "#55ff55",
        RARE = "#5555ff",
        EPIC = "#aa00aa",
        LEGENDARY = "#ffaa00",
        MYTHIC = "#ff55ff",
        SUPREME = "#AA0000",
        SPECIAL = "#FF5555",
        VERY_SPECIAL = "#FF5555"
    }


    let color = !tier ? DEFAULT_COLOR : (TIER_COLORS[tier.toUpperCase()] || DEFAULT_COLOR);

    return {
        color: color,
        fontFamily: "monospace",
        fontWeight: "bold"
    }
}

export function enchantmentAndReforgeCompare(a: Enchantment | Reforge, b: Enchantment | Reforge): number {
    let aName = a.name ? a.name.toLowerCase() : "";
    let bName = b.name ? b.name.toLowerCase() : "";

    if (aName === "any" || (aName === "none" && bName !== "any")) {
        return -1;
    }
    if (bName === "any" || bName === "none") {
        return 1;
    }

    return aName.localeCompare(bName);
}