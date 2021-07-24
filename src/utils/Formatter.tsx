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
    // special per item Formating
    formatted = formatted?.replace("Pet Item", '');
    if (formatted?.startsWith("Pet"))
        formatted = formatted?.replace("Pet", '') + " Pet";
    if (formatted?.startsWith("Ring"))
        formatted = formatted?.replace("Ring ", '') + " Ring";
    return formatted;
}

/**
 * Converts a camelCase string (e.g. woodenAxe) to a sentence case (e.g. Wooden axe)
 * @param camelCase 
 */
export function camelCaseToSentenceCase(camelCase: string): string {


    const exceptions = ["UId"];

    if (exceptions.findIndex(a => a === camelCase) > -1) {
        return camelCase;
    }

    var result = camelCase.replace(/([A-Z])/g, " $1");
    var finalResult = result.split(' ');
    var isFirstWord = true;
    finalResult.forEach((word, i) => {
        if (word !== "" && isFirstWord) {
            isFirstWord = false;
            return;
        }
        finalResult[i] = word.toLowerCase();
    });
    return finalResult.join(" ");
}

export function getStyleForTier(tier?: string | number): CSSProperties {

    interface TierColour {
        colourCode: string,
        type: string
    }

    let tierColors : TierColour[] = [
        { type: "COMMON", colourCode: "black" },
        { type: "UNCOMMON", colourCode: "#55ff55" },
        { type: "RARE", colourCode: "#5555ff" },
        { type: "EPIC", colourCode: "#aa00aa" },
        { type: "LEGENDARY", colourCode: "#ffaa00" },
        { type: "SPECIAL", colourCode: "#FF5555" },
        { type: "VERY_SPECIAL", colourCode: "#FF5555" },
        { type: "MYTHIC", colourCode: "#ff55ff" },
        { type: "SUPREME", colourCode: "#AA0000" }]


    let color: TierColour | undefined;

    if (tier) {
        //!tier ? DEFAULT_COLOR : (TIER_COLORS[tier.toString().toUpperCase()] || 
        if(!isNaN(Number(tier))){
            color = tierColors[tier]
        } else {
            color = tierColors.find(color => {
                return color.type === tier.toString().toUpperCase();
            })
        }
    }

    return {
        color: color ? color.colourCode : tierColors[0].colourCode,
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