import * as BABYLON from "@babylonjs/core";
import { GridMaterial } from "@babylonjs/materials/grid/gridMaterial";

enum Rotation {
  RotLeft = 0,
  Rotight,
}

export class Object {
  private mesh: BABYLON.Mesh;
  public orientationScales: BABYLON.Vector3;

  private empty: boolean;

  constructor() {
    this.crateEmptyObject();
    return;
  }

  private crateEmptyObject() {
    this.empty = true;
    this.orientationScales = new BABYLON.Vector3();
  }

  public getMesh() {
    return this.mesh;
  }

  public setMesh(mesh: BABYLON.Mesh) {
    if ((mesh.name = "")) {
      return;
    }

    this.empty = false;

    this.mesh = mesh;
    this.orientationScales.x =mesh.scaling.x;
    this.orientationScales.z =mesh.scaling.z;
    this.orientationScales.y =mesh.scaling.y;
  }

  public isEmpty() {
    return this.empty;
  }
}

export default class Playground {
  private readonly boxSize = 1;

  private readonly spaceBoxSize = 30;
  private readonly decelarationDeltaY = 32;

  private cameraRadius = 20;

  private hl: BABYLON.HighlightLayer;

  private focusedObject: Object;

  private zoomSlowness = 5;
  private camera: BABYLON.ArcRotateCamera;

  private focus(currentMesh) {
    if (
      !this.focusedObject.isEmpty() &&
      currentMesh != this.focusedObject.getMesh()
    ) {
      this.unfocus();
    }
    this.focusedObject.setMesh(currentMesh);
    this.focusedObject.getMesh().enableEdgesRendering();
    this.hl.addMesh(this.focusedObject.getMesh(), BABYLON.Color3.White(), true);
  }

  private unfocus() {
    this.hl.removeMesh(this.focusedObject.getMesh());
    this.focusedObject.getMesh().disableEdgesRendering();
    this.focusedObject = new Object();
  }

  private rotate(direction: Rotation) {
    //Rotate object with 45 degrees
    const amount = Math.PI / 4;
    let isRightAngle = false;
    if (this.focusedObject.isEmpty()) {
      return;
    }

    if (Math.abs(this.focusedObject.getMesh().rotation.y) >= 2 * Math.PI) {
      this.focusedObject.getMesh().rotation.y = 0;
    }

    switch (direction) {
      case Rotation.RotLeft: {
        this.focusedObject.getMesh().rotation.y += amount;
        break;
      }
      case Rotation.Rotight: {
        this.focusedObject.getMesh().rotation.y -= amount;
        break;
      }
      default: {
        break;
      }
    }
    let rotationDegree = Math.abs(
      BABYLON.Tools.ToDegrees(this.focusedObject.getMesh().rotation.y)
    );

    if (rotationDegree % 180 == 0) {
      isRightAngle = true;
      this.focusedObject.orientationScales.x = this.focusedObject.getMesh().scaling.x,
      this.focusedObject.orientationScales.z = this.focusedObject.getMesh().scaling.z;
    } else if (rotationDegree % 90 == 0) {
      isRightAngle = true;
      this.focusedObject.orientationScales.x = this.focusedObject.getMesh().scaling.z,
      this.focusedObject.orientationScales.z = this.focusedObject.getMesh().scaling.x;
    }

    if (!isRightAngle) {
      return;
    }

    console.log("R orOff " + this.focusedObject.orientationScales);
    console.log("R or " + this.focusedObject.getMesh().scaling);
    if (
      (this.focusedObject.getMesh().scaling.x +
        this.focusedObject.getMesh().scaling.z) %
        2 !=
      0
    ) {
      let offsetX =
        this.focusedObject.orientationScales.x % 2 != 0 ? this.boxSize / 2 : 0;
      let offsetZ =
        this.focusedObject.orientationScales.z % 2 != 0 ? this.boxSize / 2 : 0;

      this.focusedObject.getMesh().position.x = this.getClosestCell(
        this.focusedObject.getMesh().position.x,
        offsetX
      );
      this.focusedObject.getMesh().position.z = this.getClosestCell(
        this.focusedObject.getMesh().position.z,
        offsetZ
      );
    }
  }

  private createCube(color: string, pos: BABYLON.Vector3, sizes): BABYLON.Mesh {
    const box = BABYLON.MeshBuilder.CreateBox("box", {});

    box.scaling = new BABYLON.Vector3(sizes[0], sizes[1], sizes[2]);

    box.edgesWidth = 1;
    box.edgesColor = new BABYLON.Color4(1, 1, 1, 1);

    console.log("Before" + pos);
    box.position.x = this.snap(pos.x, box.scaling.x);
    box.position.z = this.snap(pos.z, box.scaling.z);
    console.log("After" + box.position);
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

  private getClosestCell(x: number, offsetX: number = 0) {
    return (
      (Math.abs(x - Math.trunc(x)) > 0 ? Math.ceil(x) : Math.floor(x)) - offsetX
    );
  }

  private snap(x: number, size: number, offsetX: number = 0) {
    let newX = this.getClosestCell(x, offsetX);

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
    this.focusedObject = new Object();

    let cube = new Object();
    cube.setMesh(this.createCube(
      "#4A6DE5",
      new BABYLON.Vector3(0, 0, 0),
      [1, 1, 1]
    ));
    let cube1 = new Object();

    cube1.setMesh(this.createCube(
      "#4912E5",
      new BABYLON.Vector3(3, 0, 4),
      [2, 1, 3]
    ));

    //cube.actionManager = new BABYLON.ActionManager(scene);

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
          if (!this.focusedObject.isEmpty()) {
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
          currentMesh.position.y = this.snap(currentY, currentMesh.scaling.y);
        }

        return;
      }

      let current = getGroundPosition();

      if (!current) {
        return;
      }

      console.log("Curr: " + current);
      console.log("Before: " + currentMesh.position);

      let offsetX =
        this.focusedObject.orientationScales.x !=
        this.focusedObject.getMesh().scaling.x
          ? this.boxSize / 2
          : 0;
      let offsetZ =
        this.focusedObject.orientationScales.z !=
        this.focusedObject.getMesh().scaling.z
          ? this.boxSize / 2
          : 0;

      console.log("orOff " +this.focusedObject.orientationScales);
      console.log("or" + this.focusedObject.getMesh().scaling);

      currentMesh.position.x = this.snap(
        current.x,
        this.focusedObject.orientationScales.x
      );
      currentMesh.position.z = this.snap(
        current.z,
        this.focusedObject.orientationScales.z
      );

      console.log("After: " + currentMesh.position);
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
