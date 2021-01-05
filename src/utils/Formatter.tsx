/*
 Returns a given number as string with thousands-seperators. Example:
 1234567 => 1.234.567

 Default-Seperator: '.'
*/

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

    let formatted: string = itemTag.replaceAll("_", " ").toLowerCase();
    formatted = capitalizeWords(formatted);
    return formatted;
}