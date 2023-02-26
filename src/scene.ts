import * as BABYLON from "@babylonjs/core";
import { GridMaterial } from "@babylonjs/materials/grid/gridMaterial";

enum Rotation {
  RotLeft = 0,
  Rotight,
}

export default class Playground {
  private readonly boxSize = 1;

  private readonly spaceBoxSize = 30;
  private readonly decelarationDeltaY = 32;

  private cameraRadius = 20;

  private hl: BABYLON.HighlightLayer;

  private focusedMesh: BABYLON.Mesh;

  private zoomSlowness = 5;
  private camera: BABYLON.ArcRotateCamera;

  private focus(currentMesh) {
    if (this.focusedMesh && currentMesh != this.focusedMesh) {
      this.unfocus();
    }
    this.focusedMesh = currentMesh;
    this.focusedMesh.enableEdgesRendering();
    this.hl.addMesh(this.focusedMesh, BABYLON.Color3.White(), true);
  }

  private unfocus() {
    this.hl.removeMesh(this.focusedMesh);
    this.focusedMesh.disableEdgesRendering();
    this.focusedMesh = new BABYLON.Mesh("");
  }

  private rotate(direction: Rotation) {
    //Rotate object with 45 degrees
    const amount = Math.PI / 4;
    if (!this.focusedMesh) {
      return;
    }

    if (Math.abs(this.focusedMesh.rotation.y) >= 2 * Math.PI) {
      this.focusedMesh.rotation.y = 0;
    }

    switch (direction) {
      case Rotation.RotLeft: {
        this.focusedMesh.rotation.y += amount;
        break;
      }
      case Rotation.Rotight: {
        this.focusedMesh.rotation.y -= amount;
        break;
      }
      default: {
        break;
      }
    }
  }

  private createCube(color: string, pos: BABYLON.Vector3, sizes): BABYLON.Mesh {
    const box = BABYLON.MeshBuilder.CreateBox("box", {});

    box.scaling = new BABYLON.Vector3(sizes[0], sizes[1], sizes[2]);

    box.edgesWidth = 1;
    box.edgesColor = new BABYLON.Color4(1, 1, 1, 1);

    box.position.x = this.snap(pos.x, this.boxSize, box.scaling.x);
    box.position.z = this.snap(pos.z, this.boxSize, box.scaling.z);
    box.position.y = box.scaling.y / 2;

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
    return ground;
  }

  private getClosestCell(x: number) {
    return Math.abs(x - Math.trunc(x)) >= 0 ? Math.ceil(x) : Math.floor(x);
  }

  private snap(x: number, referenceSize: number, size) {
    let newX = this.getClosestCell(x);
    return newX + size / 2;
  }

  private onObjectCamera() {
    this.camera.detachControl();
    this.camera.lowerRadiusLimit = this.camera.upperRadiusLimit =
      this.camera.radius;
  }
  private offObjectCamera(canvas) {
    this.camera.attachControl(canvas, true);
    this.camera.lowerRadiusLimit = this.camera.upperRadiusLimit = null;
  }

  public createScene(
    engine: BABYLON.Engine,
    canvas: HTMLCanvasElement
  ): BABYLON.Scene {
    // This creates a basic Babylon Scene object (non-mesh)
    var scene = new BABYLON.Scene(engine);
    this.camera = new BABYLON.ArcRotateCamera(
      "camera",
      -Math.PI / 2,
      Math.PI / 4,
      this.cameraRadius,
      new BABYLON.Vector3(0, 0, 0)
    );
    this.camera.attachControl(canvas, true);
    this.camera.wheelPrecision = this.zoomSlowness;

    const light = new BABYLON.HemisphericLight(
      "light",
      new BABYLON.Vector3(1, 1, 0),
      scene
    );

    this.hl = new BABYLON.HighlightLayer("hl", scene);
    light.intensity = 1;

    scene.hoverCursor = "default";

    let cube = this.createCube(
      "#4A6DE5",
      new BABYLON.Vector3(0, 0, 0),
      [1, 1, 1]
    );
    let cube1 = this.createCube(
      "#4912E5",
      new BABYLON.Vector3(3, 0, 4),
      [1, 2, 1]
    );
    let cube3 = this.createCube(
      "#43D100",
      new BABYLON.Vector3(2, 0, 6),
      [2, 1, 1]
    );
    let cube4 = this.createCube(
      "#97D1FF",
      new BABYLON.Vector3(5, 0, 0),
      [2, 1, 3]
    );
    let cube5 = this.createCube(
      "#4338DC",
      new BABYLON.Vector3(6, 0, 7),
      [1, 2, 3]
    );
    let cube7 = this.createCube(
      "#FFD100",
      new BABYLON.Vector3(-10, 0, 4),
      [2, 1, 2]
    );
    let cube8 = this.createCube(
      "#43FF00",
      new BABYLON.Vector3(-6, 0, 8),
      [2, 2, 1]
    );
    let cube9 = this.createCube(
      "#57D100",
      new BABYLON.Vector3(-4, 0, 4),
      [3, 3, 3]
    );

    cube.actionManager = new BABYLON.ActionManager(scene);

    let ground = this.createPlane();
    let currentMesh;

    let previousPosition;

    let previousY = 0;
    let currentY = previousY;

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
        previousPosition = null;
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
          if (this.focusedMesh) {
            this.offObjectCamera(canvas);
            this.unfocus();
          }
          return;
        }

        this.focus(currentMesh);
        this.onObjectCamera();

        previousPosition = currentMesh.position;
      }
    };

    scene.onPointerMove = (evt) => {
      if (!previousPosition) {
        return;
      }

      if (!currentMesh) {
        return;
      }

      if (evt.ctrlKey) {
        previousY =
          currentY != currentMesh.position.y
            ? currentY
            : currentMesh.position.y;
        currentY = currentY - evt.movementY / this.decelarationDeltaY;
        if (Math.abs(currentY - previousY) > 0) {
          currentMesh.position.y = this.snap(
            currentY,
            this.boxSize,
            currentMesh.scaling.y
          );
        }

        return;
      }

      let current = getGroundPosition();
      console.log("Curr:" + current);

      if (!current) {
        return;
      }

      currentMesh.position.x = this.snap(current.x,this.boxSize, currentMesh.scaling.x);
      currentMesh.position.z = this.snap(current.z,this.boxSize ,currentMesh.scaling.z);
    };

    window.addEventListener(
      "wheel",
      (evt) => {
        if (this.focusedMesh == ground) {
          return;
        }

        let direction = evt.deltaY < 0 ? Rotation.RotLeft : Rotation.Rotight;
        this.rotate(direction);
      },
      { passive: true }
    );

    return scene;
  }
}
