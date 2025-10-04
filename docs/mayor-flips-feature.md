# Mayor Flips Feature

## Overview
The Mayor Flips feature provides Hypixel SkyBlock players with data-driven predictions about item price changes based on mayor elections. This feature analyzes historic price data from previous mayor terms to estimate how item prices will change when the next mayor is elected.

## Implementation Details

### Files Created
- `/app/mayor/page.tsx` - Main page component for mayor flips
- `/components/MayorFlips/MayorFlips.tsx` - Mayor flips display component
- `/components/MayorFlips/index.tsx` - Export file

### Files Modified
- `/components/FlippingHub/FlippingHub.tsx` - Added Mayor Flips card to the flipping hub
- `/utils/sitemap-config.ts` - Added SEO metadata for the mayor flips page

### API Integration
The feature uses the existing API endpoint:
- **Endpoint**: `/api/flip/mayor`
- **Query Function**: `getApiFlipMayor()`
- **Data Type**: `MayorDiffFlip[]`

### Data Schema
The `MayorDiffFlip` interface includes:
- `itemTag` - Item identifier
- `itemName` - Display name
- `averageMayorMedianDiff` - Average price difference between mayor terms
- `volume` - Trading volume
- `expectedPrice` - Predicted price after next mayor
- `medianPrice` - Current median price
- `nextMayor` - Predicted next mayor (if available)
- `currentMayor` - Current mayor (if available)
- `usedPricesAfterCurrentMayor` - Whether current mayor data was used
- `usedPricesBeforeNextMayor` - Whether next mayor data was used

## Features

### Sort Options
1. **Expected Profit** - Sort by predicted profit (default)
2. **Price Change %** - Sort by percentage price change
3. **Volume** - Sort by trading volume
4. **Current Price** - Sort by current market price
5. **Expected Price** - Sort by predicted future price

### Display Information
Each flip shows:
- Item name and image
- Expected profit with percentage change (color-coded: green for profit, red for loss)
- Current median price
- Expected price after mayor election
- Trading volume
- Average mayor-based price difference
- Current and next mayor (when available)
- Data source (which historic mayor data was used)

### Educational Content
The page includes three expandable sections:
1. **How mayor flipping works** - Explains the analysis methodology
2. **Understanding the data** - Details each metric shown
3. **Tips for mayor flipping** - Best practices for using the feature

## SEO Optimization

### Metadata
- **Title**: "Mayor Flips - Hypixel SkyBlock"
- **Description**: "Maximize profits with Hypixel SkyBlock mayor flips! Discover items predicted to change value when the next mayor is elected. Our analysis uses historic price data from previous mayor terms to estimate upcoming price shifts and profit opportunities."
- **Keywords**: mayor flips, hypixel skyblock, skyblock flips, mayor election, derpy mayor, diana mayor, price prediction, skyblock profit, hypixel flipping

### Sitemap Entry
- **URL**: `/mayor`
- **Priority**: 0.7 (same as other flip types like Fusion)
- **Change Frequency**: daily
- **Title**: "Mayor Flips - Election Price Prediction & Historic Analysis"

## User Experience

### Premium Integration
- Top 3 flips are censored for non-premium users
- Premium message: "The top 3 mayor flips can only be seen with starter premium or better"

### Filtering
- Name-based search filter
- Minimum profit filter
- Both filters work together (AND logic)

### Item Links
- Each flip links to the detailed item page for further analysis
- Click message: "Click on a flip for further details"

## Technical Implementation

### Data Flow
1. Server-side data prefetching using React Query
2. Hydration boundary for seamless client-side hydration
3. Suspense query for loading states
4. Memoized flip data for performance

### Styling
- Responsive layout using GenericFlipList component
- Color-coded profit indicators
- Item images loaded lazily
- Consistent with other flip pages (Forge, Kat, etc.)

## Future Enhancements
Potential improvements:
- Mayor election countdown timer
- Historic price charts showing mayor-specific trends
- Notifications for high-profit mayor flips
- Filter by specific mayor perks
- Confidence score for predictions
