import * as BABYLON from "@babylonjs/core";
import { GridMaterial } from "@babylonjs/materials/grid/gridMaterial";
import { posix } from "path";

export default class Playground {
  private readonly boxSize = 1;

  private readonly spaceBoxSize = 30;
  private readonly groundHeight = (this.boxSize + 0.01) / 2;

  private readonly decelarationDeltaY = 32;

  private createCube(color: string, pos: BABYLON.Vector3): BABYLON.Mesh {
    const box = BABYLON.MeshBuilder.CreateBox("box", {});

    box.scaling = new BABYLON.Vector3(this.boxSize, this.boxSize, this.boxSize);

    box.edgesWidth = 1;
    box.edgesColor = new BABYLON.Color4(1, 1, 1, 1);
    box.position = pos;

    box.position.y = this.groundHeight;

    const boxMat = new BABYLON.StandardMaterial("boxMat");
    boxMat.diffuseColor = BABYLON.Color3.FromHexString(color);

    box.material = boxMat;

    return box;
  }

  private createPlane(): BABYLON.Mesh {
    const ground = BABYLON.MeshBuilder.CreateGround("ground", {
      width: this.spaceBoxSize,
      height: this.spaceBoxSize,
    });

    const grid = new GridMaterial("groundMaterial");
    ground.material = grid;
    grid.mainColor = new BABYLON.Color3(0.09, 0.21, 0.62);

    ground.position.x += this.boxSize / 2;
    ground.position.z += this.boxSize / 2;

    return ground;
  }

  private snap(x: number, referenceSize: number) {
    let res = x % referenceSize;
    let isCloser = false;
    if (Math.abs(res) == 0) {
      isCloser = true;
    }

    return isCloser ? Math.floor(x + res) : Math.ceil(x + res);
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

    scene.hoverCursor = "default";

    let cube = this.createCube("#4A6DE5", new BABYLON.Vector3());
    let cube1 = this.createCube("#4912E5", new BABYLON.Vector3(3, 1, 4));
    let cube2 = this.createCube("#43D100", new BABYLON.Vector3(2, 1, 6));
    cube.actionManager = new BABYLON.ActionManager(scene);

    let ground = this.createPlane();
    let currentMesh: BABYLON.Nullable<BABYLON.AbstractMesh>;

    let previousPosition;

    let previousY = this.groundHeight;
    let currentY = this.groundHeight;

    let getGroundPosition = () => {
      // Use a predicate to get position on the ground
      let pickinfo = scene.pick(
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
      if (!currentMesh) {
        return;
      }

      if (previousPosition) {
        camera.attachControl();
        previousPosition = null;

        currentMesh?.disableEdgesRendering();
        currentMesh = null;
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
        previousPosition = currentMesh.position;

        camera.detachControl();
      }
    };

    scene.onPointerMove = (evt) => {
      if (!previousPosition) {
        return;
      }

      if (!currentMesh) {
        return;
      }

      console.log(currentMesh.position.y);

      if(evt.ctrlKey) {
        previousY = (currentY!=currentMesh.position.y)?currentY:currentMesh.position.y;
        currentY = currentY - evt.movementY / this.decelarationDeltaY;    
        if (Math.abs(currentY - previousY) > 0) {
          currentMesh.position.y = this.snap(currentY, currentMesh.scaling.y) + currentMesh.scaling.y/2;
        }

        return;
      }

      let current = getGroundPosition();

      if (!current) {
        return;
      }

      currentMesh.enableEdgesRendering();

      currentMesh.position.x = this.snap(current.x, currentMesh.scaling.y);
      currentMesh.position.z = this.snap(current.z, currentMesh.scaling.y);
    };

    return scene;
  }
}
