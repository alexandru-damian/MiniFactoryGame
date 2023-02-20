import * as BABYLON from 'babylonjs';

export default class Scene {

    private readonly _canvas: HTMLCanvasElement;
    private readonly _engine: BABYLON.Engine;
    
    private _scene:BABYLON.Scene;

    constructor(canvas:string)
    {
     this._canvas = document.getElementById(canvas) as HTMLCanvasElement;
     this._engine = new BABYLON.Engine(this._canvas,true);   
    }

    public createScene(): void {
        // This creates a basic Babylon Scene object (non-mesh)
        this._scene = new BABYLON.Scene(this._engine);

        // This creates and positions a free camera (non-mesh)
        var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10));

        // This targets the camera to scene origin
        camera.setTarget(BABYLON.Vector3.Zero());

        // This attaches the camera to the canvas
        camera.attachControl(this._canvas, true);

        // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
        var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), this._scene);

        // Default intensity is 1. Let's dim the light a small amount
        light.intensity = 0.7;

        // Our built-in 'sphere' shape. Params: name, options, scene
        var sphere = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: 2, segments: 32});

        // Move the sphere upward 1/2 its height
        sphere.position.y = 1;

        // Our built-in 'ground' shape. Params: name, options, scene
        var ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 6, height: 6});
    }

    public render(): void
    {
        this._engine.runRenderLoop( ()=>
        {
            this._scene.render();
        });

        window.addEventListener ('resize',()=> 
        {
            this._engine.resize;
        })
    }
}