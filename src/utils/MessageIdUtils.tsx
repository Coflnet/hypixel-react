let messageId = 0;

export function getNextMessageId(): number {
    return ++messageId;
}