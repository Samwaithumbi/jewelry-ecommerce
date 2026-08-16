export function cartKey(sessionId: string) {
    return `cart:${sessionId}`;
}