# Looking up error reports

Users can choose **Send error report** on an error screen or **Copy error details** when contacting support. Sending uses the existing feedback service with `FeedbackName: web-error`. Search the JSON `Feedback` field for the displayed **Report reference** (`reportId`). Reports include the URL, browser user agent, timestamps, full browser-provided stacks, nested error causes, and any available `traceId` or Next.js `digest`.

Deploy the companion Feedback service update first: the previous service rejected reports without `additionalInformation` and put complete stacks into Discord's limited message text. The update sends a searchable summary plus an untruncated `feedback.json` attachment. Download that attachment for diagnostics. Feedback service logs link `reportId` to the database `feedbackId`; the raw report is saved before Discord delivery. A delivery failure leaves it available in the database and returns an error so the user can retry.

The latest 20 errors in the current tab are attached to all feedback, including reload feedback. They survive reloads in session storage. Capture starts before hydration and includes browser errors, unhandled promise rejections, React error boundaries, and errors handled by the API helpers. Capturing an error does not automatically send feedback. Request headers and storage contents are not collected.

## Server failures

Next.js hides server exception details from production browsers. The **Server error reference** is its `digest`, not a distributed trace ID. Search frontend container logs for this value and the `web.request.error` event, using the report timestamp and path to narrow repeated occurrences. These JSON records contain the server stack and cause, route context, deployment version (`APP_VERSION`), and a trace ID when the error or incoming W3C `traceparent` supplies one.

If **Server trace ID** is displayed, use it directly in cluster tracing. Otherwise, find the digest in the frontend logs first and use the `traceId` from that record if present. A missing trace ID means no real trace was available; the digest still links the report to the server error log. Handled API errors are logged as `web.api.error` with their server trace IDs preserved.

## Client failures

Client errors do not have a server trace unless an API supplied one. Look up the report reference in feedback and inspect `error.stack`, `error.cause`, and `errorLog`. Entries include script filename and line/column when the browser exposes them. JavaScript stack frames retain their exact chunk URLs and offsets; production frames may still be minified. Original TypeScript source locations require source maps from the matching build; this change does not publish browser source maps.
