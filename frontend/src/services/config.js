// Configuration for API URLs in different environments
const config = {
  // In production, we use relative URLs as the API is served from the same domain
  // In development, the proxy in package.json handles the routing
  API_URL: process.env.NODE_ENV === 'production' ? '/api' : '/api'
};

export default config; 