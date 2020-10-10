/*
 Returns a given number as string with thousands-seperators. Example:
 1234567 => 1.234.567

 Default-Seperator: '.'
*/

export function numberWithThousandsSeperators(number: number, seperator?: string): string {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, seperator || ".");
}