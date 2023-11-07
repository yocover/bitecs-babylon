import './style.css';
import { Application } from '../src/demo2';

const width = window.innerWidth;
const height = window.innerHeight;

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<canvas width="${width}" height="${height}" class="render-canvas"></canvas>
`;

const canvas = document.querySelector('canvas') as HTMLCanvasElement;

const appInstance = Application.createApp(canvas);
appInstance.start();
