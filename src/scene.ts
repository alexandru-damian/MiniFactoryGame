import * as BABYLON from "@babylonjs/core";
import { GridMaterial } from "@babylonjs/materials/grid/gridMaterial";

import { Object } from "./components/object";
import {GameConfig} from "./config/gameConfig";
import {CameraConfig} from "./config/cameraConfig";

enum Rotation {
  RotLeft = 0,
  Rotight,
}

export default class Playground {
  private readonly decelarationDeltaY = 64;

  private hl: BABYLON.HighlightLayer;

  private focusedObject: Object;

  private zoomSlowness = 5;
  private camera: BABYLON.ArcRotateCamera;

  private objects: Map<number, Object>;
  private sizeObjects: number;

  private focus(currentMesh) {
    if (
      !this.focusedObject.isEmpty() &&
      currentMesh != this.focusedObject.mesh
    ) {
      this.unfocus();
    }
    let currentObject: Object = this.objects.get(Number(currentMesh.id))!;

    if (!currentObject) {
      return;
    }

    this.focusedObject = currentObject;
    this.focusedObject.mesh.enableEdgesRendering();
    this.hl.addMesh(this.focusedObject.mesh, BABYLON.Color3.White(), true);
  }

  private unfocus() {
    this.hl.removeMesh(this.focusedObject.mesh);
    this.focusedObject.mesh.disableEdgesRendering();
    this.objects.set(
      Number(this.focusedObject.mesh.id),
      this.focusedObject.cloneObjProperties()
    );
    this.focusedObject = new Object();
  }

  private rotate(direction: Rotation) {
    //Rotate object with 45 degrees
    const amount = Math.PI / 4;
    let isRightAngle = false;
    if (this.focusedObject.isEmpty()) {
      return;
    }

    if (Math.abs(this.focusedObject.mesh.rotation.y) >= 2 * Math.PI) {
      this.focusedObject.mesh.rotation.y = 0;
    }

    switch (direction) {
      case Rotation.RotLeft: {
        this.focusedObject.mesh.rotation.y += amount;
        break;
      }
      case Rotation.Rotight: {
        this.focusedObject.mesh.rotation.y -= amount;
        break;
      }
      default: {
        break;
      }
    }
    let rotationDegree = Math.abs(
      BABYLON.Tools.ToDegrees(this.focusedObject.mesh.rotation.y)
    );

    if (rotationDegree % 180 == 0) {
      isRightAngle = true;
      this.focusedObject._orientationScaling.x =
        this.focusedObject.mesh.scaling.x;
      this.focusedObject._orientationScaling.z =
        this.focusedObject.mesh.scaling.z;
    } else if (rotationDegree % 90 == 0) {
      isRightAngle = true;
      this.focusedObject._orientationScaling.x =
        this.focusedObject.mesh.scaling.z;
      this.focusedObject._orientationScaling.z =
        this.focusedObject.mesh.scaling.x;
    }

    if (!isRightAngle) {
      return;
    }

    if (
      (this.focusedObject.mesh.scaling.x + this.focusedObject.mesh.scaling.z) %
        2 !=
      0
    ) {
      let orientantionX = this.focusedObject._orientationScaling.x % 2 ? 1 : -1;
      let orientantionZ = this.focusedObject._orientationScaling.z % 2 ? 1 : -1;

      this.focusedObject.mesh.position.x = this.snapToGrid(
        this.focusedObject.mesh.position.x,
        this.focusedObject._orientationScaling.x,
        (orientantionX * GameConfig._SIZE_GRID_CELL) / 2
      );
      this.focusedObject.mesh.position.z = this.snapToGrid(
        this.focusedObject.mesh.position.z,
        this.focusedObject._orientationScaling.z,
        (orientantionZ * GameConfig._SIZE_GRID_CELL) / 2
      );
    }
  }

  private createCube(
    id: string,
    color: string,
    pos: BABYLON.Vector3,
    sizes: BABYLON.Vector3
  ): BABYLON.Mesh {
    const box = BABYLON.MeshBuilder.CreateBox(id, {});

    box.scaling = sizes.clone();

    box.edgesWidth = 1;
    box.edgesColor = new BABYLON.Color4(1, 1, 1, 1);

    box.position.x = this.snapToGrid(pos.x, sizes.x, GameConfig._SIZE_GRID_CELL / 2);
    box.position.z = this.snapToGrid(pos.z, sizes.z, GameConfig._SIZE_GRID_CELL / 2);
    box.position.y = sizes.y / 2;

    const boxMat = new BABYLON.StandardMaterial("boxMat");
    boxMat.diffuseColor = BABYLON.Color3.FromHexString(color);

    box.material = boxMat;
    return box;
  }

  private createPlane(): BABYLON.Mesh {
    const ground = BABYLON.MeshBuilder.CreateGround("ground", {
      width: GameConfig._SIZE_GRID,
      height: GameConfig._SIZE_GRID,
    });

    const grid = new GridMaterial("groundMaterial");
    ground.material = grid;
    ground.position = new BABYLON.Vector3(
      -GameConfig._SIZE_GRID_CELL / 2,
      0,
      -GameConfig._SIZE_GRID_CELL / 2
    );
    grid.mainColor = new BABYLON.Color3(0.09, 0.21, 0.62);
    return ground;
  }

  private snapToGrid(
    x: number,
    size: number,
    offsetX: number = 0,
    snapToY: boolean = false
  ) {
    let result = Math.round(x);

    if (size % 2 == 0) {
      let sign = x < 0 ? -1 : 1;
      return Math.trunc(x) + offsetX * sign;
    }

    return result;
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

  private createTestMeshes(
    size: number,
    colors: string[],
    coords: Array<BABYLON.Vector3>,
    scales: Array<BABYLON.Vector3>
  ) {
    for (let index = 0; index < size; ++index) {
      this.objects.set(this.sizeObjects, new Object());
      let obj = this.objects.get(this.sizeObjects++)!;
      
      obj.mesh= this.createCube(
        String(this.sizeObjects - 1),
        colors[index],
        coords[index],
        scales[index]
      )!;
    }
  }

  public createScene(
    engine: BABYLON.Engine,
    canvas: HTMLCanvasElement
  ): BABYLON.Scene {
    // This creates a basic Babylon Scene object (non-mesh)
    var scene = new BABYLON.Scene(engine);
    this.camera = new BABYLON.ArcRotateCamera(
      CameraConfig._NAME,
      CameraConfig._PITCH,
      CameraConfig._YAW,
      CameraConfig._CAMERA_RADIUS
      ,
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
    this.focusedObject = new Object();

    this.objects = new Map<number, Object>();
    this.sizeObjects = this.objects.size;

    let colors = [
      "#4A6DE5",
      "#4912E5",
      "#43D100",
      "#97D1FF",
      "#4338DC",
      "#FFD100",
      "#43FF00",
      "#57D100",
    ];
    let coords: Array<BABYLON.Vector3> = new Array();
    let scales: Array<BABYLON.Vector3> = new Array();

    coords.push(new BABYLON.Vector3());
    coords.push(new BABYLON.Vector3(3, 0, 4));
    coords.push(new BABYLON.Vector3(2, 0, 6));
    coords.push(new BABYLON.Vector3(5, 0, 0));
    coords.push(new BABYLON.Vector3(6, 0, 7));
    coords.push(new BABYLON.Vector3(-10, 0, 4));
    coords.push(new BABYLON.Vector3(-6, 0, 8));
    coords.push(new BABYLON.Vector3(-3, 0, 8));

    scales.push(new BABYLON.Vector3(1, 1, 1));
    scales.push(new BABYLON.Vector3(1, 2, 1));
    scales.push(new BABYLON.Vector3(2, 1, 1));
    scales.push(new BABYLON.Vector3(1, 1, 2));
    scales.push(new BABYLON.Vector3(1, 2, 3));
    scales.push(new BABYLON.Vector3(2, 1, 2));
    scales.push(new BABYLON.Vector3(2, 2, 1));
    scales.push(new BABYLON.Vector3(3, 3, 3));

    let ground = this.createPlane();
    this.createTestMeshes(colors.length, colors, coords, scales);

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

    scene.onPointerUp = (evt) => {
      if (this.focusedObject.isEmpty()) {
        return;
      }

      this.focusedObject.mesh.visibility = 1;

      this.focusedObject.mesh.position.x = this.snapToGrid(
        this.focusedObject.mesh.position.x,
        this.focusedObject._orientationScaling.x,
        GameConfig._SIZE_GRID_CELL / 2
      );
      this.focusedObject.mesh.position.z = this.snapToGrid(
        this.focusedObject.mesh.position.z,
        this.focusedObject._orientationScaling.z,
        GameConfig._SIZE_GRID_CELL / 2
      );

      if (evt.ctrlKey) {
        let snapWeightY = 1;
        if (scene.pointerY >= canvas.height / 2) {
          snapWeightY = -1;
        }

        this.focusedObject.mesh.position.y =
          this.snapToGrid(
            this.focusedObject.mesh.position.y,
            this.focusedObject.mesh.scaling.y,
            (GameConfig._SIZE_GRID_CELL / 2) * snapWeightY,
            true
          ) +
          GameConfig._SIZE_GRID_CELL / 2;
      }

      if (previousPosition) {
        previousPosition = null;
      }
    };

    scene.onPointerDown = (evt, pickResult) => {
      if (evt.button !== 0) {
        return;
      }
      let currentMesh;

      if (pickResult.hit) {
        currentMesh = pickResult.pickedMesh;
        if (currentMesh == ground || !currentMesh) {
          if (!this.focusedObject.isEmpty()) {
            this.offObjectCamera(canvas);
            this.unfocus();
          }
          return;
        }

        this.focus(currentMesh);
        this.focusedObject.mesh.visibility = 0.5;
        this.onObjectCamera();

        previousPosition = currentMesh.position;
      }
    };

    scene.onPointerMove = (evt) => {
      if (!previousPosition) {
        return;
      }

      if (this.focusedObject.isEmpty()) {
        return;
      }

      if (evt.ctrlKey) {
        previousY =
          currentY != this.focusedObject.mesh.position.y
            ? currentY
            : this.focusedObject.mesh.position.y;
        currentY = currentY - evt.movementY / this.decelarationDeltaY;
        if (Math.abs(currentY - previousY) > 0) {
          this.focusedObject.mesh.position.y = currentY;
        }

        return;
      }

      let currentGroundPos = getGroundPosition() as BABYLON.Vector3;

      if (!currentGroundPos) {
        return;
      }

      this.focusedObject.mesh.position.x = currentGroundPos.x;
      this.focusedObject.mesh.position.z = currentGroundPos.z;
    };

    window.addEventListener(
      "wheel",
      (evt) => {
        if (this.focusedObject.isEmpty()) {
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
