require ('esbuild').build(
{
    entryPoints: ['./src/app.ts'],
    bundle : true,
    sourcemap: true,
    target: 'es2022',
    format: 'esm',
    outfile: './dist/scripts/app.js'
}).catch(()=>process.exit(1));