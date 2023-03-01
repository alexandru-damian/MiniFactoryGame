import * as BABYLON from "@babylonjs/core";
import { GridMaterial } from "@babylonjs/materials/grid/gridMaterial";

enum Rotation {
  RotLeft = 0,
  Rotight,
}

class Object {
  private mesh: BABYLON.Mesh;
  public orientationScales: BABYLON.Vector3;

  private empty: boolean;

  constructor() {
    this.crateEmptyObject();
    return;
  }

  private crateEmptyObject() {
    this.empty = true;
  }

  public getMesh() {
    return this.mesh;
  }

  public setMesh(mesh: BABYLON.Mesh) {
    if (mesh.id == "") {
      return;
    }

    this.empty = false;

    this.mesh = mesh;
    if (!this.orientationScales) {
      this.orientationScales = mesh.scaling.clone();
    }
  }

  public cloneObjProperties(): Object {
    let newObj = new Object();

    newObj.empty = this.empty;
    newObj.mesh = this.mesh;
    newObj.orientationScales = this.orientationScales.clone();

    return newObj;
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

  private objects: Map<number, Object>;
  private sizeObjects: number;

  private focus(currentMesh) {
    if (
      !this.focusedObject.isEmpty() &&
      currentMesh != this.focusedObject.getMesh()
    ) {
      this.unfocus();
    }
    let currentObject: Object = this.objects.get(Number(currentMesh.id))!;

    if (!currentObject) {
      return;
    }

    this.focusedObject = currentObject;
    this.focusedObject.getMesh().enableEdgesRendering();
    this.hl.addMesh(this.focusedObject.getMesh(), BABYLON.Color3.White(), true);
  }

  private unfocus() {
    this.hl.removeMesh(this.focusedObject.getMesh());
    this.focusedObject.getMesh().disableEdgesRendering();
    this.objects.set(
      Number(this.focusedObject.getMesh().id),
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
      this.focusedObject.orientationScales.x =
        this.focusedObject.getMesh().scaling.x;
      this.focusedObject.orientationScales.z =
        this.focusedObject.getMesh().scaling.z;
    } else if (rotationDegree % 90 == 0) {
      isRightAngle = true;
      this.focusedObject.orientationScales.x =
        this.focusedObject.getMesh().scaling.z;
      this.focusedObject.orientationScales.z =
        this.focusedObject.getMesh().scaling.x;
    }

    if (!isRightAngle) {
      return;
    }

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

    box.position.x = this.snap(pos.x, box.scaling.x);
    box.position.z = this.snap(pos.z, box.scaling.z);
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

  private createTestMeshes(
    size: number,
    colors: string[],
    coords: Array<BABYLON.Vector3>,
    scales: Array<BABYLON.Vector3>
  ) {
    for (let index = 0; index < size; ++index) {
      this.objects.set(this.sizeObjects, new Object());
      this.objects
        .get(this.sizeObjects++)
        ?.setMesh(
          this.createCube(
            String(this.sizeObjects - 1),
            colors[index],
            coords[index],
            scales[index]
          )
        );
    }
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
    coords.push(new BABYLON.Vector3(-4, 0, 8));

    scales.push(new BABYLON.Vector3(1, 1, 1));
    scales.push(new BABYLON.Vector3(1, 2, 1));
    scales.push(new BABYLON.Vector3(2, 1, 1));
    scales.push(new BABYLON.Vector3(1, 1, 2));
    scales.push(new BABYLON.Vector3(1, 2, 3));
    scales.push(new BABYLON.Vector3(2, 1, 2));
    scales.push(new BABYLON.Vector3(2, 2, 1));
    scales.push(new BABYLON.Vector3(3, 3, 3));

    this.createTestMeshes(colors.length, colors, coords, scales);

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

      currentMesh.position.x = this.snap(
        current.x,
        this.focusedObject.orientationScales.x
      );
      currentMesh.position.z = this.snap(
        current.z,
        this.focusedObject.orientationScales.z
      );
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
