import { nodeResolve } from '@rollup/plugin-node-resolve';
import html from '@web/rollup-plugin-html';
import copy from 'rollup-plugin-copy';

export default {
    input: 'index.html',
    output: { dir: 'dist' },
    plugins: [
        nodeResolve(),
        html(),
        copy({
            targets: [
                { src: 'sampleimages', dest: 'dist/' },
            ]
        })],
};
