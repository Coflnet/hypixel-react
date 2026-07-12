// @ts-nocheck
import { defineConfig } from 'orval';

const localSkyApiBaseUrl = 'http://localhost:5006';

export default defineConfig({
  skycofl: {
    input: {
      target: `${localSkyApiBaseUrl}/api/swagger/v1/swagger.json`
    },
    output: {
      client: "react-query",
      target: './api/_generated/skyApi.ts',
      mode: 'single',
      baseUrl: localSkyApiBaseUrl,
      httpClient: 'fetch'
    },
  },
});