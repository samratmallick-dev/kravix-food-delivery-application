import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APP_TSX_PATH = path.join(__dirname, '..', 'src', 'App.tsx');
const SITEMAP_PATH = path.join(__dirname, '..', 'public', 'sitemap.xml');

const PRIORITY_SCORES = {
      '/': 1.0,
      '/search': 0.9,
      '/about': 0.8,
      '/contact': 0.8,
      '/faq': 0.8,
      '/help': 0.7,
      '/blog': 0.7,
      '/privacy': 0.5,
      '/terms': 0.5,
      '/refunds': 0.5,
      '/login': 0.4,
      '/register': 0.4,
};

const EXCLUDED_PATHS = new Set([
      'dashboard', 'users', 'restaurants', 'riders', 'orders',
      'analytics', 'coupons', 'reviews', 'cart', 'checkout',
      'address', 'account', 'select-role', 'payment-success',
      'order-success', 'ordersuccess', 'verify-email',
      'forgot-password', 'reset-password',
      'earnings', 'wallet', 'profile', 'documents', 'settings',
]);

function generateSitemap() {
      try {
            console.log('Generating sitemap dynamically from router...');
            if (!fs.existsSync(APP_TSX_PATH)) {
                  throw new Error(`App.tsx not found at ${APP_TSX_PATH}`);
            }

            const appContent = fs.readFileSync(APP_TSX_PATH, 'utf-8');

            const pathRegex = /path=[\"']([^\"']+)[\"']/g;
            const extractedRoutes = new Set();

            let match;
            while ((match = pathRegex.exec(appContent)) !== null) {
                  const routePath = match[1];
                  extractedRoutes.add(routePath);
            }

            const isExcluded = (route) => {
                  const cleaned = route.replace(/^\//, '');
                  return (
                        route === '*' ||
                        route === '/*' ||
                        route.includes(':') ||
                        route.includes('*') ||
                        cleaned.startsWith('admin') ||
                        cleaned.startsWith('seller') ||
                        cleaned.startsWith('rider') ||
                        EXCLUDED_PATHS.has(cleaned)
                  );
            };

            const cleanRoutes = Array.from(extractedRoutes)
                  .map(route => {
                        let r = route;
                        if (!r.startsWith('/')) r = '/' + r;
                        return r;
                  })
                  .filter(route => !isExcluded(route));

            if (!cleanRoutes.includes('/')) {
                  cleanRoutes.unshift('/');
            }

            const sortedRoutes = cleanRoutes.sort((a, b) => {
                  const pa = PRIORITY_SCORES[a] ?? 0.6;
                  const pb = PRIORITY_SCORES[b] ?? 0.6;
                  return pb - pa;
            });

            const now = new Date().toISOString().split('T')[0];

            const xmlUrls = sortedRoutes.map(route => {
                  const priority = PRIORITY_SCORES[route] !== undefined ? PRIORITY_SCORES[route] : 0.6;
                  const changefreq = route === '/' || route === '/search' ? 'daily' : 'weekly';
                  return `  <url>
    <loc>https://kravix-nu.vercel.app${route === '/' ? '' : route}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority.toFixed(1)}</priority>
  </url>`;
            }).join('\n');

            const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlUrls}
</urlset>`;

            const dir = path.dirname(SITEMAP_PATH);
            if (!fs.existsSync(dir)) {
                  fs.mkdirSync(dir, { recursive: true });
            }

            fs.writeFileSync(SITEMAP_PATH, sitemapXml);
            console.log(`Successfully generated sitemap.xml with ${sortedRoutes.length} public paths!`);
      } catch (err) {
            console.warn('Warning: sitemap generation failed (non-fatal):', err.message);
      }
}

generateSitemap();