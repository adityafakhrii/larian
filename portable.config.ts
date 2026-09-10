import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  plugins:[react()],
  resolve:{alias:{'@':fileURLToPath(new URL('.',import.meta.url))}},
  css:{postcss:{plugins:[tailwindcss()]}},
  build:{outDir:'out',emptyOutDir:true,cssCodeSplit:false,lib:{entry:'standalone/main.tsx',name:'Larian',formats:['iife'],fileName:()=> 'larian.js'}},
  define:{'process.env.NODE_ENV':JSON.stringify('production')},
});

