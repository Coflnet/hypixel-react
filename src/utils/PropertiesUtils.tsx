import properties from '../properties.json';

export function getProperty(propertyName: string) {
    return properties[propertyName];
}