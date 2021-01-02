import { nodeResolve } from '@rollup/plugin-node-resolve';

export default [{
        input: 'src/gallery.js',
        output: {
            file: 'demo/gallery.js',
            format: 'es',
            name: 'gallery'
        },
        plugins: [nodeResolve()]
    }
];
