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
  value: number;
}

export class GameObject {
  private _mesh: Mesh;
  public _orientationScaling: Vector3;
  private _hitAxisObjs: HitAxisObjs;

  private readonly AXES: Axis[] = ["x", "z"];
  private readonly DEFAULT_HIT_AXIS: HitAxis = {
    axis: "",
    direction: 0,
    value: Number.POSITIVE_INFINITY,
  };

  private _empty: boolean;
  private _highlightLayer: HighlightLayer;

  private _grabbed: boolean;

  private crateEmptyObject() {
    this._empty = true;
    this._highlightLayer = new HighlightLayer("hl");
    this._hitAxisObjs = new Map<GameObject, HitAxis>();
  }

  constructor() {
    this.crateEmptyObject();
  }

  public addObj(obj: GameObject) {
    this._hitAxisObjs.set(obj, this.DEFAULT_HIT_AXIS);
  }

  public get mesh() {
    return this._mesh;
  }

  public get hitAxisObjs() {
    return this._hitAxisObjs;
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
    this._hitAxisObjs.clear();
  }

  private calculateHitAxis(newPosition: Vector3, obj: GameObject): void {
    let updatedAxis: HitAxis = this.DEFAULT_HIT_AXIS;
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

    console.log(updatedAxis);

    if (updatedAxis.axis != "" && updatedAxis.direction != 0) {
      this._hitAxisObjs.set(obj, updatedAxis);
    }
  }

  private updateClosestAxis(
    updatedAxis: HitAxis,
    axis: Axis,
    direction: number,
    obj: GameObject
  ): HitAxis {
    let newHittedAxis: HitAxis = {
      axis: axis,
      direction: direction,
      value: 0,
    };

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
        [obj.mesh.position[axisColided.axis], obj._orientationScaling[axisColided.axis]],
        [this.mesh.position[axisColided.axis], this._orientationScaling[axisColided.axis]]
      );
    }
    return utils.calculateDeltaSize(
      [this.mesh.position[axisColided.axis], this._orientationScaling[axisColided.axis]],
      [obj.mesh.position[axisColided.axis], obj._orientationScaling[axisColided.axis]]
    );
  }

  private updatePointOnAxis(hitAxis: HitAxis, obj: GameObject): number {
    if (hitAxis.direction > 0) {
      return (
        obj.mesh.position[hitAxis.axis] -
        obj._orientationScaling[hitAxis.axis] / 2 -
        this._orientationScaling[hitAxis.axis] / 2
      );
    }

    return (
      obj.mesh.position[hitAxis.axis] +
      obj._orientationScaling[hitAxis.axis] / 2 +
      this._orientationScaling[hitAxis.axis] / 2
    );
  }

  private updateWallPointOnAxis(newPosition: Vector3): void {
    for (let hitAxisObj of this._hitAxisObjs) {
      if (hitAxisObj[1].direction != 0) {
        newPosition[hitAxisObj[1].axis] = this.updatePointOnAxis(
          hitAxisObj[1],
          hitAxisObj[0]
        );
      }
    }
  }

  private calculateClosestDirections(newPosition: Vector3): void {
    for (let hitAxisObj of this._hitAxisObjs) {
      this.calculateHitAxis(newPosition, hitAxisObj[0]);
    }
  }

  public onCollide(newPosition: Vector3): void {
    this.calculateClosestDirections(newPosition);
    this.updateWallPointOnAxis(newPosition);
  }
}

export type Axis = string;

export type HitAxisObjs = Map<GameObject, HitAxis>;
export type Objects = Map<number, GameObject>;
