import properties from '../properties';

export function getProperty(propertyName: string) {

    if (typeof window === "undefined") {
        return null;
    }

    // Dynamicly change properties
    if((window as any).dynamicProps && (window as any).dynamicProps[propertyName]){
        return (window as any).dynamicProps[propertyName];
    }

    return properties[propertyName];
}