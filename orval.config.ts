import { defineConfig } from 'orval';

export default defineConfig({
  skycofl: {
    input: {
      target: 'http://localhost:5005/api/swagger/v1/swagger.json'
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