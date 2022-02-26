export function isClientSideRendering() {
    return typeof window !== 'undefined'
}
