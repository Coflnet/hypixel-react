import { getSettingsObject, setSetting, ITEM_FAVORITES_KEY } from './SettingsUtils'
import { isClientSideRendering } from './SSRUtils'

function persistFavorites(favorites: FavoriteItemEntry[]) {
	if (!isClientSideRendering()) {
		return
	}

	setSetting(ITEM_FAVORITES_KEY, JSON.stringify(favorites))
}

export function getFavoriteItems(): FavoriteItemEntry[] {
	if (!isClientSideRendering()) {
		return []
	}

	return getSettingsObject<FavoriteItemEntry[]>(ITEM_FAVORITES_KEY, [])
}

export function isItemFavorite(tag: string | undefined): boolean {
	if (!tag) {
		return false
	}

	return getFavoriteItems().some(f => f.tag === tag)
}

export function toggleFavoriteItem(item: FavoriteItemEntry): { favorites: FavoriteItemEntry[]; isFavorite: boolean } {
	if (!isClientSideRendering()) {
		return { favorites: [], isFavorite: false }
	}

	const favorites = getFavoriteItems()
	const exists = favorites.some(f => f.tag === item.tag)

	if (exists) {
		const newFavorites = favorites.filter(f => f.tag !== item.tag)
		persistFavorites(newFavorites)
		return { favorites: newFavorites, isFavorite: false }
	}

	const newFavorites = [...favorites, { ...item, addedAt: new Date().toISOString() }]
	persistFavorites(newFavorites)
	return { favorites: newFavorites, isFavorite: true }
}
