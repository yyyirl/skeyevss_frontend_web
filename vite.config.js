import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from '@svgr/rollup'
import path from 'path'

export default defineConfig(({ mode, command }) => {
    const env = loadEnv(mode, process.cwd(), '')
    const createProxyConfig = () => {
        const proxyConfig = {}

        if (env.VITE_BACKEND_PROXY && env.VITE_BACKEND_API_URL) {
            const backendProxyPath = env.VITE_BACKEND_PROXY
            proxyConfig[ `^/${ backendProxyPath }` ] = {
                target: env.VITE_BACKEND_API_URL,
                secure: false,
                changeOrigin: true,
                rewrite: (path) => path.replace(new RegExp(`^/${backendProxyPath}`), ''),
            }
        }

        if (env.VITE_EXTERNAL_PROXY && env.VITE_BACKEND_API_URL) {
            const externalProxyPath = env.VITE_EXTERNAL_PROXY
            proxyConfig[ `^/${ externalProxyPath }` ] = {
                target: env.VITE_BACKEND_API_URL,
                secure: false,
                changeOrigin: true,
                rewrite: (path) => path.replace(new RegExp(`^/${externalProxyPath}`), ''),
            }
        }

        return proxyConfig
    }

    return {
        server: {
            port: env.PORT,
            host: '127.0.0.1',
            open: true,
            cors: true,
            proxy: createProxyConfig(),
        },
        resolve: {
            alias: {
                '@': path.resolve(__dirname, 'src'),
                '#': path.resolve(__dirname, 'src'),
                '#databases': path.resolve(__dirname, 'src/databases'),
                '#types': path.resolve(__dirname, 'src/types'),
                '#assets': path.resolve(__dirname, 'src/assets'),
                '#constants': path.resolve(__dirname, 'src/constants'),
                '#utils': path.resolve(__dirname, 'src/utils'),
                '#pages': path.resolve(__dirname, 'src/pages'),
                '#components': path.resolve(__dirname, 'src/components'),
                '#routers': path.resolve(__dirname, 'src/routers'),
                '#repositories': path.resolve(__dirname, 'src/repositories'),

                ...(mode === 'production' && env.VITE_ENABLE_PROFILING === 'true' && {
                    'react-dom$': 'react-dom/profiling',
                    'scheduler/tracing': 'scheduler/tracing-profiling',
                }),
            },
        },
        base: '/',
        plugins: [
            react({
                jsxRuntime: 'classic',
            }),
            svgr()
        ],
        build: {
            // minify: 'esbuild', // TODO 调试
            // sourcemap: true, // TODO 调试
            assetsDir: 'assets',
            target: 'es2015',
            outDir: 'build',
            reportCompressedSize: true,
            chunkSizeWarningLimit: 400,
            algorithm: 'gzip',
            ext: '.gz',
            deleteOriginFile: true,
            threshold: 10240,
            rollupOptions: {
                output: {
                    chunkFileNames: 'assets/js/[name]-[hash].js',
                    entryFileNames: 'assets/js/[name]-[hash].js',
                    assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
                    manualChunks: {
                        'r-react': [ 'react' ],
                        'r-react-dom': [ 'react-dom', 'react-router-dom' ],
                        'r-utils': [ 'lodash', 'axios', 'dayjs' ],
                        'r-md': [ '@uiw/react-md-editor' ],
                        'r-editor': [ 'react-quill' ],
                        'r-echarts': [ 'echarts-for-react', 'echarts' ],
                        'r-xlsx': [ 'xlsx' ],
                        'r-antd-icons': [ '@ant-design/icons' ],
                        'r-antd-form': [
                            'antd/lib/form',
                            'antd/lib/input',
                            'antd/lib/button',
                            'antd/lib/select'
                        ],
                        'r-antd-data': [
                            'antd/lib/table',
                            'antd/lib/pagination',
                            'antd/lib/typography'
                        ],
                        'r-antd-1': [
                            'antd/lib/layout',
                            'antd/lib/menu',
                            'antd/lib/grid',
                            'antd/lib/space',
                            'antd/lib/modal',
                            'antd/lib/message',
                            'antd/lib/notification',
                            'antd/lib/spin',
                            'antd/lib/date-picker',
                            'antd/lib/time-picker',
                            'antd/lib/upload',
                            'antd/lib/avatar',
                            'antd/lib/badge',
                            'antd/lib/card',
                            'antd/lib/carousel',
                            'antd/lib/cascader',
                            'antd/lib/checkbox',
                            'antd/lib/collapse',
                            'antd/lib/descriptions',
                            'antd/lib/divider',
                            'antd/lib/drawer',
                            'antd/lib/dropdown',
                            'antd/lib/empty',
                            'antd/lib/image',
                            'antd/lib/list',
                            'antd/lib/mentions',
                            'antd/lib/popconfirm',
                            'antd/lib/popover',
                            'antd/lib/progress',
                            'antd/lib/radio',
                            'antd/lib/rate',
                            'antd/lib/result',
                            'antd/lib/segmented',
                            'antd/lib/skeleton',
                            'antd/lib/slider',
                            'antd/lib/statistic',
                            'antd/lib/steps',
                            'antd/lib/switch',
                            'antd/lib/tabs',
                            'antd/lib/tag',
                            'antd/lib/timeline',
                            'antd/lib/tooltip',
                            'antd/lib/tree',
                            'antd/lib/tree-select',
                            'antd/lib/alert',
                            'antd/lib/anchor',
                            'antd/lib/breadcrumb',
                            'antd/lib/calendar',
                            'antd/lib/config-provider',
                            'antd/lib/affix',
                            'antd/lib/app',
                            'antd/lib/back-top',
                            'antd/lib/col',
                            'antd/lib/row',
                            'antd/lib/flex',
                            'antd/lib/watermark',
                            'antd/lib/qr-code',
                            'antd/lib/color-picker',
                            'antd/lib/tour'
                        ],
                    },
                },
            },
        },
        esbuild: {
            jsx: 'automatic',
        },
        define: {
            'process.env.NODE_ENV': JSON.stringify(mode),
            ...(env.VITE_BACKEND_PROXY && {
                'process.env.VITE_BACKEND_PROXY': JSON.stringify(env.VITE_BACKEND_PROXY),
            }),
            ...(env.VITE_BACKEND_API_URL && {
                'process.env.VITE_BACKEND_API_URL': JSON.stringify(env.VITE_BACKEND_API_URL),
            }),
        },
    }
})