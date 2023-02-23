import * as BABYLON from "@babylonjs/core";
import { GridMaterial } from "@babylonjs/materials/grid/gridMaterial";

export default class Playground {
  private readonly defaultY = 0.5;
  private readonly boxSize = 1;

  private createCube(): BABYLON.Mesh {
    const box = BABYLON.MeshBuilder.CreateBox("box", {});

    box.position.y = this.defaultY;
    box.scaling = new BABYLON.Vector3(this.boxSize, this.boxSize, this.boxSize);

    box.edgesWidth = 1;
    box.edgesColor = new BABYLON.Color4(1, 1, 1, 1);

    box.position.y = this.boxSize / 2;

    const boxMat = new BABYLON.StandardMaterial("boxMat");
    boxMat.diffuseColor = new BABYLON.Color3(0.09, 0.21, 0.62);

    box.material = boxMat;

    return box;
  }

  public createScene(
    engine: BABYLON.Engine,
    canvas: HTMLCanvasElement
  ): BABYLON.Scene {
    // This creates a basic Babylon Scene object (non-mesh)
    var scene = new BABYLON.Scene(engine);
    const camera = new BABYLON.ArcRotateCamera(
      "camera",
      -Math.PI / 2,
      Math.PI / 2.5,
      15,
      new BABYLON.Vector3(0, 0, 0)
    );
    camera.attachControl(canvas, true);
    const light = new BABYLON.HemisphericLight(
      "light",
      new BABYLON.Vector3(1, 1, 0),
      scene
    );

    light.intensity = 1;

    const ground = BABYLON.MeshBuilder.CreateGround(
      "ground",
      { width: 30, height: 30 },
      scene
    );

    scene.hoverCursor = "default";

    const grid = new GridMaterial("groundMaterial", scene);
    ground.material = grid;
    grid.mainColor = new BABYLON.Color3(0.09, 0.21, 0.62);

    let cube = this.createCube();
    cube.actionManager = new BABYLON.ActionManager(scene);

    let currentMesh: BABYLON.Nullable<BABYLON.AbstractMesh>;


    const hl = new BABYLON.HighlightLayer("hl", scene);
    let previousPosition;

    var getGroundPosition = function () {
      // Use a predicate to get position on the ground
      var pickinfo = scene.pick(
        scene.pointerX,
        scene.pointerY,
        function (mesh) {
          return mesh == ground;
        }
      );
      if (pickinfo.hit) {
        return pickinfo.pickedPoint;
      }

      return null;
    };

    scene.onPointerUp = () => {
      if (previousPosition) {
        camera.attachControl();
        previousPosition = null;
        currentMesh?.disableEdgesRendering();
      }
    };

    scene.onPointerDown = (evt, pickResult) => {
      if (evt.button !== 0) {
        return;
      }

      if (pickResult.hit) {
        currentMesh = pickResult.pickedMesh;
        if (currentMesh == ground || !currentMesh) {
          return;
        }

        currentMesh?.enableEdgesRendering();
        previousPosition = getGroundPosition();

        camera.detachControl();
      }
    };

    scene.onPointerMove = () => {
      if (!previousPosition) {
        return;
      }

      let current = getGroundPosition();

      if (!current || !currentMesh) {
        return;
      }

      let diff = current.subtract(previousPosition) as BABYLON.Vector3;

      currentMesh.enableEdgesRendering();
      currentMesh.position.addInPlace(diff);

      previousPosition = current;
    };

    return scene;
  }
}
