import { defineConfig } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('--- VITE CONFIG: PLUGIN SETUP ---');

const courseRoutingPlugin = () => {
    return {
        name: 'course-routing-plugin',
        configureServer(server) {
            console.log('!!! PLUGIN CONFIGURE_SERVER CALLED !!!');

            server.middlewares.use(async (req, res, next) => {
                const url = req.url.split('?')[0];

                // Filter out assets/internal to reduce noise
                // Exclude common assets from being routed as HTML
                const isAsset = /\.(png|jpg|jpeg|webp|gif|svg|css|js|json|ico|woff|woff2|ttf|eot)$/i.test(url);
                if (isAsset || url.startsWith('/@') || url.startsWith('/node_modules')) {
                    return next();
                }

                // if (!url.includes('.')) {
                //      console.log(`[Middleware] Request: ${url}`);
                // }

                if (url.startsWith('/curso/') ||
                    url.startsWith('/graduacao/') ||
                    url.startsWith('/pos-graduacao/') ||
                    url.startsWith('/livres/')) {

                    // console.log(`[Middleware] *** SERVING CURSO.HTML FOR: ${url} ***`);

                    try {
                        const template = fs.readFileSync(resolve(__dirname, 'curso.html'), 'utf-8');
                        const html = await server.transformIndexHtml(req.url, template);

                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'text/html');
                        res.end(html);
                        return;
                    } catch (e) {
                        console.error('[Middleware] Error:', e);
                        return next(e);
                    }
                }

                // Explicit redirects for clean URLs
                const pages = ['cursos', 'quem-somos', 'noticias', 'npj', 'fale-conosco', 'estrutura'];
                const segment = url.replace(/^\/|\/$/g, '');
                if (pages.includes(segment)) {
                    console.log(`[Middleware] Serving static page: ${segment}`);
                    req.url = `/${segment}.html`;
                }

                // Admin
                if (url === '/admin' || url === '/admin/') {
                    req.url = '/admin/index.html';
                }

                // News
                if (url.startsWith('/news/') || url.startsWith('/noticias/')) {
                    req.url = '/news.html';
                }

                next();
            });
        }
    }
};

export default defineConfig({
    plugins: [courseRoutingPlugin()],
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                admin: resolve(__dirname, 'admin/index.html'),
                curso: resolve(__dirname, 'curso.html'),
                cursos: resolve(__dirname, 'cursos.html'),
                quem_somos: resolve(__dirname, 'quem-somos.html'),
                noticias: resolve(__dirname, 'noticias.html'),
                news: resolve(__dirname, 'news.html'),
                npj: resolve(__dirname, 'npj.html'),
                estrutura: resolve(__dirname, 'estrutura.html'),
                fale_conosco: resolve(__dirname, 'fale-conosco.html')
            },
        },
    },
});
