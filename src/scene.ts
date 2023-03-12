import * as BABYLON from "@babylonjs/core";
import { GridMaterial } from "@babylonjs/materials/grid/gridMaterial";

import { GameObject, Objects, Rotation } from "./components/object";
import { GameConfig } from "./config/gameConfig";
import { CameraConfig } from "./config/cameraConfig";
import * as utils from "./components/utils";
import { Collision, FaceBox } from "./components/collision";
import { Vector3 } from "@babylonjs/core";

export default class Playground {
  private readonly decelarationDeltaY = 64;

  private _currentObject: GameObject;

  private zoomSlowness = 5;
  private camera: BABYLON.ArcRotateCamera;

  private _objects: Objects;
  private sizeObjects: number;
  private _collisions: Collision;

  private focus(currentMesh) {
    if (
      !this._currentObject.isEmpty() &&
      currentMesh != this._currentObject.mesh
    ) {
      this.unfocus();
    }
    this._currentObject = this.getObject(Number(currentMesh.id));
    this._currentObject.onFocus();
  }

  private unfocus() {
    this._currentObject.offFocus();
    this.updateObject();
    this._currentObject = new GameObject();
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

    box.position.x = utils.snapToGrid(
      pos.x,
      sizes.x,
      GameConfig._SIZE_GRID_CELL / 2
    );
    box.position.z = utils.snapToGrid(
      pos.z,
      sizes.z,
      GameConfig._SIZE_GRID_CELL / 2
    );
    box.position.y = sizes.y / 2 - GameConfig._SIZE_GRID_CELL / 2;

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
      -GameConfig._SIZE_GRID_CELL / 2,
      -GameConfig._SIZE_GRID_CELL / 2
    );
    grid.mainColor = new BABYLON.Color3(0.09, 0.21, 0.62);
    return ground;
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

  private getObject(id: number): GameObject {
    return this._objects.get(Number(id))!;
  }

  private updateObject(): void {
    this._objects.set(
      Number(this._currentObject.mesh.id),
      this._currentObject.cloneObjProperties()
    );
  }

  private createTestMeshes(
    size: number,
    colors: string[],
    coords: Array<BABYLON.Vector3>,
    scales: Array<BABYLON.Vector3>
  ) {
    for (let index = 0; index < size; ++index) {
      this._objects.set(this.sizeObjects, new GameObject());
      let obj = this._objects.get(this.sizeObjects++)!;

      obj.mesh = this.createCube(
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
      CameraConfig._CAMERA_RADIUS,
      new BABYLON.Vector3(0, 0, 0)
    );
    this.camera.attachControl(canvas, true);
    this.camera.wheelPrecision = this.zoomSlowness;

    const light = new BABYLON.HemisphericLight(
      "light",
      new BABYLON.Vector3(1, 1, 0),
      scene
    );
    light.intensity = 1;

    scene.hoverCursor = "default";
    this._currentObject = new GameObject();

    this._objects = new Map<number, GameObject>();
    this.sizeObjects = this._objects.size;

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
    this._collisions = new Collision(this._objects);

    let previousY = 0;
    let currentY = previousY;
    let previous: Vector3;
    let face: FaceBox;

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
      if (this._currentObject.isEmpty()) {
        return;
      }

      this._currentObject.onDrop();
      this.offObjectCamera(canvas);
    };

    scene.onPointerDown = (evt, pickResult) => {
      if (evt.button !== 0) {
        return;
      }
      let currentMesh;

      if (pickResult.hit) {
        currentMesh = pickResult.pickedMesh;
        if (currentMesh == ground || !currentMesh) {
          if (!this._currentObject.isEmpty()) {
            this.unfocus();
          }
          return;
        }

        this.focus(currentMesh);
        previous = this._currentObject.mesh.position.clone();
      }
    };

    scene.onPointerMove = (evt) => {
      if (!this._currentObject.grabbed) {
        return;
      }

      this.onObjectCamera();
      this._currentObject.mesh.visibility = 0.5;

      if (evt.ctrlKey) {
        previousY =
          currentY != this._currentObject.mesh.position.y
            ? currentY
            : this._currentObject.mesh.position.y;
        currentY = currentY - evt.movementY / this.decelarationDeltaY;
        if (Math.abs(currentY - previousY) > 0) {
          this._currentObject.mesh.position.y = currentY;
        }

        return;
      }

      let currentGroundPos = getGroundPosition() as BABYLON.Vector3;

      if (!currentGroundPos) {
        return;
      }

      this._currentObject.mesh.position.x = currentGroundPos.x;
      this._currentObject.mesh.position.z = currentGroundPos.z;

      let delta = new Vector3();
      delta.fromArray(
        utils.delta(currentGroundPos.asArray(), previous.asArray())
      );

      if (
        Math.abs(delta.x) >= GameConfig._SIZE_GRID_CELL
      ) {
        face = this._collisions.getBoundingBoxFace(delta);
        previous.x = this._currentObject.mesh.position.x;
        console.log("face: " + String(face));
      }else if (
        Math.abs(delta.z) >= GameConfig._SIZE_GRID_CELL
      ) {
        face = this._collisions.getBoundingBoxFace(delta);
        previous.z = this._currentObject.mesh.position.z;
        console.log("face: " + String(face));
      }

      this._collisions.collides(
        this._currentObject,
        (currentMesh, collidedMesh): void => {
          if (
            face == FaceBox.Right &&
            this._currentObject.mesh.position.x +
              this._currentObject.mesh.scaling.x / 2 >
              collidedMesh.position.x - collidedMesh.scaling.x / 2
          ) {
            this._currentObject.mesh.position.x =
              collidedMesh.position.x -
              collidedMesh.scaling.x / 2 -
              currentMesh.scaling.x / 2;
              previous.x = this._currentObject.mesh.position.x;
          } else if (
            face == FaceBox.Left &&
            this._currentObject.mesh.position.x -
              this._currentObject.mesh.scaling.x / 2 <
              collidedMesh.position.x + collidedMesh.scaling.x / 2
          ) {
            this._currentObject.mesh.position.x =
              collidedMesh.position.x +
              collidedMesh.scaling.x / 2 +
              currentMesh.scaling.x / 2;
              previous.x = this._currentObject.mesh.position.x;
          }else
           if (face == FaceBox.Front &&
            this._currentObject.mesh.position.z +
              this._currentObject.mesh.scaling.z / 2 >
            collidedMesh.position.z - collidedMesh.scaling.z / 2
          ) {
            this._currentObject.mesh.position.z =
              collidedMesh.position.z -
              collidedMesh.scaling.z / 2 -
              currentMesh.scaling.z / 2;
              previous.z = this._currentObject.mesh.position.z;
          }else if (face == FaceBox.Back &&
            this._currentObject.mesh.position.z -
              this._currentObject.mesh.scaling.z / 2 <
            collidedMesh.position.z + collidedMesh.scaling.z / 2
          ) {
            this._currentObject.mesh.position.z =
              collidedMesh.position.z +
              collidedMesh.scaling.z / 2 +
              currentMesh.scaling.z / 2;
              previous.z = this._currentObject.mesh.position.z;
          }
        }
      );
    };

    window.addEventListener(
      "keydown",
      (evt) => {
        if (this._currentObject.isEmpty()) {
          return;
        }

        switch (evt.code) {
          case "KeyQ": {
            this._currentObject.rotate(Rotation.RLEFT);
            break;
          }
          case "KeyE": {
            this._currentObject.rotate(Rotation.RRIGHT);
            break;
          }
          default: {
            break;
          }
        }
      },
      { passive: true }
    );

    return scene;
  }
}
