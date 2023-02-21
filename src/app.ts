import Playground from './scene';

import {Engine} from '@babylonjs/core/Engines/engine';

window.addEventListener ('DOMContentLoaded', ()=>
{
    let canvas = document.getElementById("canvas") as HTMLCanvasElement;
    let engine = new Engine(canvas);

    let scene = Playground.CreateScene(engine, canvas);

    engine.runRenderLoop(()=>
    {
        scene.render();
    })

    window.addEventListener("resize", ()=>
    {
        engine.resize();
    })
})