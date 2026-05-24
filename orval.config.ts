import { defineConfig } from 'orval';

export default defineConfig({
  skycofl: {
    input: {
      target: 'https://sky.coflnet.com/api/swagger/v1/swagger.json'
    },
    output: {
      client: "react-query",
      target: './api/_generated',
      mode: 'split',
      baseUrl: 'https://sky.coflnet.com',
      httpClient: 'fetch'
    },
  },
});