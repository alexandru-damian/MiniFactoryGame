import { Mesh } from "@babylonjs/core";
import { Vector3, Color3, Tools } from "@babylonjs/core/";
import { HighlightLayer } from "@babylonjs/core";
import { GameConfig } from "../config/gameConfig";
import * as utils from "./utils";

export enum Rotation {
  RLEFT = 0,
  RRIGHT,
}

export class HitAxis {
  axis: Axis;
  direction: number;
  value: number;

  constructor(_axis: Axis, _direction: number, _val: number) {
    this.axis = _axis;
    this.direction = _direction;
    this.value = _val;
  }
}

export class GameObject {
  private _mesh: Mesh;
  public _orientationScaling: Vector3;
  private _hitAxesObjs: HitAxisObjs;

  private readonly AXES: Axis[] = ["x", "z"];
  private readonly DEFAULT_HIT_AXIS: HitAxis = new HitAxis(
    "",
    0,
    Number.POSITIVE_INFINITY
  );

  private _empty: boolean;
  private _highlightLayer: HighlightLayer;

  private _grabbed: boolean;

  private crateEmptyObject() {
    this._empty = true;
    this._highlightLayer = new HighlightLayer("hl");
    this._hitAxesObjs = new Map<GameObject, HitAxis>();
  }

  constructor() {
    this.crateEmptyObject();
  }

  public addHitAxis(key: GameObject, value: HitAxis): void {
    this._hitAxesObjs.set(key, value);
  }

  public get mesh() {
    return this._mesh;
  }

  public get hitAxesObjs() {
    return this._hitAxesObjs;
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

  public calculateSnapOnAxis(
    axis: Axis,
    x: number,
    offset: number = GameConfig._SIZE_GRID_CELL
  ): number {
    return utils.snapToGrid(x, this._orientationScaling[axis], offset / 2);
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
    this._hitAxesObjs.clear();
  }

  public calculateHitAxis(newPosition: Vector3, obj: GameObject): boolean {
    let updatedAxis: HitAxis =
      this.hitAxesObjs.get(obj) ?? this.DEFAULT_HIT_AXIS;
    let direction: number;

    for (let axis of this.AXES) {
      direction = utils.calculateDirection(
        this.mesh.position[axis],
        newPosition[axis]
      );
      if (direction != 0) {
        updatedAxis = this.updateClosestAxis(updatedAxis, axis, direction, obj);
      }
    }

    console.log("Updating");
    console.log(updatedAxis);

    if (updatedAxis.axis != "" && updatedAxis.direction != 0) {
      this.addHitAxis(obj, updatedAxis);
      return true;
    }

    return false;
  }

  private updateClosestAxis(
    updatedAxis: HitAxis,
    axis: Axis,
    direction: number,
    obj: GameObject
  ): HitAxis {
    let newHittedAxis: HitAxis = new HitAxis(axis, direction, 0);

    let diffA: number = updatedAxis.value;
    let diffB: number = this.findCollidedSize(newHittedAxis, obj);

    if (diffB < diffA) {
      newHittedAxis.value = diffB;
      return newHittedAxis;
    }
    return updatedAxis;
  }

  private findCollidedSize(axisColided: HitAxis, obj: GameObject): number {
    if (axisColided.direction == 0) {
      return Number.POSITIVE_INFINITY;
    }

    if (axisColided.direction > 0) {
      return utils.calculateDeltaSize(
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
    return utils.calculateDeltaSize(
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

  public calulateHitPointOnAxis(hitAxis: HitAxis, obj: GameObject): number {
    if (hitAxis.direction > 0) {
      return (
        obj.mesh.position[hitAxis.axis] -
        (obj._orientationScaling[hitAxis.axis] * GameConfig._SCALE_BOX) / 2 -
        (this._orientationScaling[hitAxis.axis] * GameConfig._SCALE_BOX) / 2
      );
    }

    return (
      obj.mesh.position[hitAxis.axis] +
      (obj._orientationScaling[hitAxis.axis] * GameConfig._SCALE_BOX) / 2 +
      (this._orientationScaling[hitAxis.axis] * GameConfig._SCALE_BOX) / 2
    );
  }

  public isOppositeDirectionColliding(
    hitAxis: HitAxis,
    newPosition: Vector3
  ): boolean {
    return (
      (hitAxis.direction > 0 &&
        newPosition[hitAxis.axis] > this.mesh.position[hitAxis.axis]) ||
      (hitAxis.direction < 0 &&
        newPosition[hitAxis.axis] < this.mesh.position[hitAxis.axis])
    );
  }

  private updateWallPointOnAxis(newPosition: Vector3): void {
    for (let hitAxisObj of this._hitAxesObjs) {
      if (hitAxisObj[1].direction != 0) {
        newPosition[hitAxisObj[1].axis] = this.calulateHitPointOnAxis(
          hitAxisObj[1],
          hitAxisObj[0]
        );
      }
      newPosition[hitAxisObj[1].axis] = this.calculateSnapOnAxis(
        hitAxisObj[1].axis,
        newPosition[hitAxisObj[1].axis]
      );
    }
  }

  public onCollide(newPosition: Vector3): void {
    this.updateWallPointOnAxis(newPosition);
  }
}

export type Axis = string;

export type HitAxisObjs = Map<GameObject, HitAxis>;
export type Objects = Map<number, GameObject>;
