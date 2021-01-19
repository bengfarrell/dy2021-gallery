import { nodeResolve } from '@rollup/plugin-node-resolve';
import html from '@web/rollup-plugin-html';
import copy from 'rollup-plugin-copy';
import clean from 'rollup-plugin-clean'

export default {
    output: { dir: 'dist' },
    plugins: [
        clean(),
        nodeResolve(),
        html({ input: ['index.html', 'about.html', 'help.html'] }),
        copy({
            targets: [
                { src: 'sampleimages', dest: 'dist/' },
                { src: 'assets/halftone-bg.jpg', dest: 'dist/assets' },
                { src: 'assets/remix-icon.svg', dest: 'dist/assets' },
                { src: 'assets/sampledata.json', dest: 'dist/assets' },
            ]
        })],
};
