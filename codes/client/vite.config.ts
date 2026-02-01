import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
//npm install @types/node --save-dev
import path from 'path'
//vite打包性能优化之开启Gzip压缩
import viteCompression from "vite-plugin-compression"; //npm i vite-plugin-compression -D 
export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 8443,
    strictPort: false, // 若3000端口被占用,是否直接结束项目
    https: false, // 是否开启 https
    open: '/dev', // 是否自动在浏览器打开
    proxy: {
      "/api": {
        target: "http://192.168.0.105:3000",
        changeOrigin: true,
        // secure: false, // 如果是https接口，需要配置这个参数
        // ws: true, // websocket是否支持
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
      "/user": {
        target: "http://192.168.0.105:3001",
        changeOrigin: true,
        // secure: false, // 如果是https接口，需要配置这个参数
        // ws: true, // websocket是否支持
        rewrite: (path) => path.replace(/^\/user/, ""),
      },
    }
  },
  build: {
    target: "es2020", //指定es版本,浏览器的兼容性
    outDir: "dist",
    assetsDir: "assets", // 指定静态资源存放路径
    cssCodeSplit: true, // css代码拆分,禁用则所有样式保存在一个css里面
    sourcemap: false, // 是否构建source map 文件
    // manifest: true, // 是否在outDir中生成 manifest.json
    rollupOptions: {
      // input: '/path/to/main.ts' // 覆盖默认的 .html 入口
    },
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    }
  },
  resolve: {
    // 配置项目路径别名，在开发时不需要写完整的路径名称
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@assets": path.resolve(__dirname, "src/assets"),
      "@components": path.resolve(__dirname, "src/components"),
      "@views": path.resolve(__dirname, "src/views"),
    },
  },
  optimizeDeps: {
    include: [],
  },
  plugins: [
    vue(),
    vuetify(),
    viteCompression({
      verbose: true,
      disable: false,
      threshold: 10240,
      algorithm: "gzip",
      ext: ".gz",
    })
  ]
})