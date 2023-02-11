import properties from '../properties'
import { isClientSideRendering } from './SSRUtils'

export function getProperty(propertyName: string) {
    // Dynamicly change properties
    if (isClientSideRendering() && (window as any).dynamicProps && (window as any).dynamicProps[propertyName]) {
        return (window as any).dynamicProps[propertyName]
    }

    return properties[propertyName]
}
