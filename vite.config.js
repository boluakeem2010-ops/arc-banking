var _a;
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
var apiPort = (_a = process.env.PORT) !== null && _a !== void 0 ? _a : '3001';
export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            '/api': "http://127.0.0.1:".concat(apiPort),
        },
    },
});
