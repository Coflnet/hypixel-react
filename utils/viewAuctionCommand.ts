const SAFE_VIEW_AUCTION = /^\/viewauction (?:[0-9a-fA-F]{32}|[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/

/** Only a plain `/viewauction <uuid>` (32 hex or dashed) is ever copied or sent to the game, whatever the API says. */
export function getViewAuctionCommand(command?: string | null): string | undefined {
    return command && SAFE_VIEW_AUCTION.test(command) ? command : undefined
}
