# Enhanced Error Handling Implementation

This document describes the enhanced error handling implemented for issue #1407.

## Problem Statement

From time to time pages were breaking, and historically it took a long time to notice. The issue requested:
1. Some kind of automatic reporting 
2. An easy way for users to get in contact written on the error page

## Solution Overview

The enhanced error handling provides:

### 🚨 Automatic Error Reporting
- When a server-side error occurs, the error details are automatically sent to the backend
- Uses the existing `sendFeedback` API with key `server_error_auto`
- Includes error message, stack trace, timestamp, URL, and user agent
- Happens silently in the background without blocking the user

### 📝 Manual Error Reporting
- Users can optionally provide additional context about what they were doing
- Choose whether to include technical details
- Select preferred contact method (Discord, Email, or none)
- Submitted via existing `sendFeedback` API with key `server_error_manual`

### 💬 Easy Contact Options
- Prominent display of Discord and Email contact information
- Direct links to join Discord (`https://discord.gg/wvKXfTgCfb`)
- Email link to support (`support@coflnet.com`)

### 🎨 Improved User Experience
- User-friendly error messaging instead of raw JSON
- Multiple recovery options (refresh, go home, try again)
- Collapsible technical details for advanced users
- Bootstrap-styled responsive design
- Clear visual hierarchy and intuitive navigation

## Technical Implementation

### Files Modified

1. **`app/error.tsx`** - Enhanced the error page component
2. **`global.d.ts`** - Added `ErrorReportData` interface

### New Interface

```typescript
interface ErrorReportData {
    userDescription: string
    includeErrorDetails: boolean
    contactMethod: 'discord' | 'email' | 'none'
}
```

### API Integration

The error reporting integrates with the existing feedback system:

- **Automatic reporting**: `api.sendFeedback('server_error_auto', errorReport)`
- **Manual reporting**: `api.sendFeedback('server_error_manual', errorReport)`

### Error Report Structure

```typescript
{
    type: 'server_error' | 'server_error_manual',
    error: string,
    stack: string,
    digest: string,
    timestamp: string,
    url: string,
    userAgent: string,
    userDescription?: string,
    contactMethod?: string,
    automaticReport: boolean
}
```

## Features

### Automatic Reporting
- Runs once when the error page loads
- Uses `useEffect` hook to prevent duplicate reports
- Fails silently if backend is unavailable
- Includes all available error context

### Manual Reporting
- Optional user description field
- Checkbox to include/exclude technical details
- Contact preference selection
- Success/failure feedback via toast notifications
- Prevents duplicate submissions

### Recovery Options
- **Refresh Page**: `window.location.reload()`
- **Return to Main Page**: Link to `/`
- **Try Again**: Uses error boundary's `reset` function (if available)

### Technical Details
- Collapsible section showing error information
- JSON formatted for readability
- Includes error message, digest, and timestamp
- Helps advanced users understand what went wrong

## Benefits

1. **Faster Issue Detection**: Automatic reporting means errors are logged immediately
2. **Better User Support**: Clear contact information and multiple support channels
3. **Improved User Experience**: Professional error page instead of raw error display
4. **Optional User Feedback**: Additional context from users helps debugging
5. **Maintains Privacy**: Users control what information is shared

## Backend Considerations

The backend should handle the new feedback keys:
- `server_error_auto`: Automatic error reports
- `server_error_manual`: Manual error reports with user context

These can be processed alongside existing feedback types and routed to appropriate monitoring/alerting systems.

## Testing

The error page can be tested by:
1. Triggering server-side errors in the application
2. Verifying automatic reporting occurs
3. Testing manual reporting with various user inputs
4. Confirming contact links work correctly
5. Validating responsive design on different screen sizes

## Future Enhancements

Potential improvements could include:
- Integration with error monitoring services (Sentry, Bugsnag)
- Error categorization and intelligent grouping
- User session replay for better debugging context
- Progressive web app offline error handling
- Error rate limiting to prevent spam