import { Mesh } from "@babylonjs/core";
import { Vector3, Color3, Tools } from "@babylonjs/core/";
import { HighlightLayer } from "@babylonjs/core";
import { GameConfig } from "../config/gameConfig";
import * as utils from "./utils";

export enum Rotation {
  RLEFT = 0,
  RRIGHT,
}

export interface HitAxis {
  axis: Axis;
  direction: number;
}

export class GameObject {
  private _mesh: Mesh;
  public _orientationScaling: Vector3;
  private _hitAxis: HitAxis;

  private _empty: boolean;
  private _highlightLayer: HighlightLayer;

  private _grabbed: boolean;
  constructor() {
    this.crateEmptyObject();
  }

  private crateEmptyObject() {
    this._empty = true;
    this._hitAxis = { axis: "", direction: 0 };
    this._highlightLayer = new HighlightLayer("hl");
  }

  public get mesh() {
    return this._mesh;
  }

  public get hitAxis() {
    return this._hitAxis;
  }

  public get grabbed(): boolean {
    return this._grabbed;
  }

  public set mesh(mesh: Mesh) {
    if (mesh.id == "") {
      return;
    }

    this._empty = false;

    this._mesh = mesh;
    if (!this._orientationScaling) {
      this._orientationScaling = mesh.scaling.clone();
    }
  }

  public cloneObjProperties(): GameObject {
    let newObj = new GameObject();

    newObj._empty = this._empty;
    newObj._mesh = this._mesh;

    newObj._orientationScaling = this._orientationScaling.clone();

    return newObj;
  }

  public isEmpty(): boolean {
    return this._empty;
  }
  public onFocus() {
    this._mesh.enableEdgesRendering();
    this._highlightLayer.addMesh(this._mesh, Color3.White(), true);
    this._grabbed = true;
  }

  public offFocus() {
    this._highlightLayer.removeMesh(this._mesh);
    this._mesh.disableEdgesRendering();
  }

  public resetHitAxis(): void {
    this._hitAxis.axis = "";
    this._hitAxis.direction = 0;
  }

  public rotate(direction: Rotation) {
    //Rotate object with 45 degrees
    const amount = Math.PI / 4;
    let isRightAngle = false;

    if (Math.abs(this._mesh.rotation.y) >= 2 * Math.PI) {
      this._mesh.rotation.y = 0;
    }

    switch (direction) {
      case Rotation.RLEFT: {
        this._mesh.rotation.y += amount;
        break;
      }
      case Rotation.RRIGHT: {
        this._mesh.rotation.y -= amount;
        break;
      }
      default: {
        break;
      }
    }
    let rotationDegree = Math.abs(Tools.ToDegrees(this._mesh.rotation.y));

    if (rotationDegree % 180 == 0) {
      isRightAngle = true;
      this._orientationScaling.x = this._mesh.scaling.x;
      this._orientationScaling.z = this._mesh.scaling.z;
    } else if (rotationDegree % 90 == 0) {
      isRightAngle = true;
      this._orientationScaling.x = this._mesh.scaling.z;
      this._orientationScaling.z = this._mesh.scaling.x;
    }

    if (!isRightAngle) {
      return;
    }

    if ((this._mesh.scaling.x + this._mesh.scaling.z) % 2 != 0) {
      let orientantionX = this._orientationScaling.x % 2 ? 1 : -1;
      let orientantionZ = this._orientationScaling.z % 2 ? 1 : -1;

      this.setX(
        this._mesh.position.x,
        orientantionX * GameConfig._SIZE_GRID_CELL
      );
      this.setZ(
        this._mesh.position.z,
        orientantionZ * GameConfig._SIZE_GRID_CELL
      );
    }
  }

  public setX(x: number, offset: number = GameConfig._SIZE_GRID_CELL) {
    this._mesh.position.x = utils.snapToGrid(
      x,
      this._orientationScaling.x,
      offset / 2
    );
  }

  public setZ(z: number, offset: number = GameConfig._SIZE_GRID_CELL) {
    this._mesh.position.z = utils.snapToGrid(
      z,
      this._orientationScaling.z,
      offset / 2
    );
  }

  public setY(y: number, offset: number = GameConfig._SIZE_GRID_CELL) {
    this._mesh.position.y = utils.snapToGrid(
      y,
      this._orientationScaling.y,
      offset / 2
    );
  }

  public onDrop() {
    this._mesh.visibility = 1;

    this.setX(this._mesh.position.x);
    this.setZ(this._mesh.position.z);
    this.setY(this._mesh.position.y);

    this._grabbed = false;
  }

  private isOutOfBounds(newPosition: Vector3): boolean {
    return (
      (this.hitAxis.direction > 0 &&
        newPosition[this._hitAxis.axis] <
          this.mesh.position[this._hitAxis.axis]) ||
      (this.hitAxis.direction < 0 &&
        newPosition[this._hitAxis.axis] >
          this.mesh.position[this._hitAxis.axis])
    );
  }

  private calculateDirection(axis: Axis, axisValue: number): number {
    if (this.mesh.position[axis] < axisValue) {
      return 1;
    }
    return -1;
  }

  private updateObjectOnAxis(newPosition: Vector3, obj: GameObject): void {
    for (let axis of ["x", "z"]) {
      let direction: number = 0;

      if (this.hitAxis.axis != axis) {
        direction = this.calculateDirection(axis, newPosition[axis]);
        this.updateClosestAxis(axis, direction, obj);
      }
    }

    if(this.isOutOfBounds(newPosition))
    {
      this.hitAxis.direction = 0;
      return;
    }

    console.log("Obj name: " + obj.mesh.name);
    console.log(this.hitAxis.direction);

    this.updateWallPointOnAxis(newPosition, obj);
  }

  private updateClosestAxis(
    axis: Axis,
    direction: number,
    obj: GameObject
  ): void {
    let diffA: number = this.findCollidedSize(this._hitAxis, obj);
    let diffB: number = this.findCollidedSize(
      { axis: axis, direction: direction },
      obj
    );

    if (diffB < diffA) {
      this.hitAxis.axis = axis;
      this._hitAxis.direction = direction;
    }
  }

  private findCollidedSize(axisColided: HitAxis, obj: GameObject): number {
    if (axisColided.axis == "") {
      return Number.POSITIVE_INFINITY;
    }

    if (axisColided.direction > 0) {
      return utils.calculateSizeDiff(
        [
          obj.mesh.position[axisColided.axis],
          obj._orientationScaling[axisColided.axis],
        ],
        [
          this.mesh.position[axisColided.axis],
          this._orientationScaling[axisColided.axis],
        ]
      );
    }
    return utils.calculateSizeDiff(
      [
        this.mesh.position[axisColided.axis],
        this._orientationScaling[axisColided.axis],
      ],
      [
        obj.mesh.position[axisColided.axis],
        obj._orientationScaling[axisColided.axis],
      ]
    );
  }

  private updateWallPointOnAxis(newPosition: Vector3, obj: GameObject): void {
    if (this._hitAxis.axis != "") {
      if (this._hitAxis.direction > 0) {
        console.log(this._hitAxis.axis + " pos");
        newPosition[this._hitAxis.axis] =
          obj.mesh.position[this._hitAxis.axis] -
          obj._orientationScaling[this._hitAxis.axis] / 2 -
          this._orientationScaling[this._hitAxis.axis] / 2;
      } else {
        console.log(this._hitAxis.axis + " neg");
        newPosition[this._hitAxis.axis] =
          obj.mesh.position[this._hitAxis.axis] +
          obj._orientationScaling[this._hitAxis.axis] / 2 +
          this._orientationScaling[this._hitAxis.axis] / 2;
      }
    }
  }

  public onCollide(newPosition: Vector3, obj: GameObject): void {
    let yCurrentObj: number =
      this.mesh.position.y - this._orientationScaling.y / 2;
    let yHittedObj: number =
      obj.mesh.position.y - obj._orientationScaling.y / 2;

    if (yCurrentObj == yHittedObj) {
      this.updateObjectOnAxis(newPosition, obj);
    }
  }
}

type Axis = string;

export type Objects = Map<number, GameObject>;
