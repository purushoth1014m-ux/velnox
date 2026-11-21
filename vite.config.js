import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';
export default defineConfig({plugins:[tailwindcss()],base:'./',build:{rollupOptions:{input:{home:resolve(import.meta.dirname,'index.html'),products:resolve(import.meta.dirname,'products.html'),quality:resolve(import.meta.dirname,'quality-packaging.html'),resources:resolve(import.meta.dirname,'buyer-resources.html'),contact:resolve(import.meta.dirname,'contact.html'),admin:resolve(import.meta.dirname,'admin.html')}}}});
