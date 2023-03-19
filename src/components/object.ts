import { Mesh } from "@babylonjs/core";
import { Vector3, Color3, Tools } from "@babylonjs/core/";
import { HighlightLayer } from "@babylonjs/core";
import { GameConfig } from "../config/gameConfig";
import * as utils from "./utils";
import { HitAxis } from "./collision";

export enum Rotation {
  RLEFT = 0,
  RRIGHT,
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
    this._hitAxis = new HitAxis();
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
    this.hitAxis.reset();
  }

  private updateObjectOnAxis(newPosition: Vector3, obj: GameObject): void {
    let closestAxis: [axis: Axis, value: number] = [
      "",
      Number.POSITIVE_INFINITY,
    ];

    for (let axis of ["x"]) {
      if (this._hitAxis[axis] == 0) {
        if (
          this.mesh.position[axis] + this._orientationScaling[axis] / 2 <
          obj.mesh.position[axis] + obj._orientationScaling[axis] / 2
        ) {
          this._hitAxis[axis] = 1;
        } else {
          this._hitAxis[axis] = -1;
        }
        closestAxis = this.calculateClosestAxis(
          axis,
          this._hitAxis[axis],
          closestAxis,
          obj
        );
      }

      console.log("update for "+axis);
      this.updateWallPointOnAxis(axis, newPosition, obj);
    }

    if (closestAxis[0] == "") {
      return;
    }
      console.log(closestAxis[0]);
      this.updateWallPointOnAxis(closestAxis[0], newPosition, obj);
  }

  private calculateClosestAxis(
    axis: Axis,
    direction: number,
    axisVal: [axis: Axis, value: number],
    obj: GameObject
  ): [Axis, number] {
    let diff: number;

    if (direction > 0) {
      diff = Math.abs(
        this.mesh.position[axis] +
          this._orientationScaling[axis] / 2 -
          obj.mesh.position[axis] -
          obj._orientationScaling[axis] / 2
      );
    } else {
      diff = Math.abs(
        this.mesh.position[axis] -
          this._orientationScaling[axis] / 2 -
          obj.mesh.position[axis] +
          obj._orientationScaling[axis] / 2
      );
    }

    return diff < axisVal[1] ? [axis, diff] : axisVal;
  }

  private updateWallPointOnAxis(
    axis: Axis,
    newPosition: Vector3,
    obj: GameObject
  ): void {
    if (this._hitAxis[axis] != 0) {
      if (
        this._hitAxis[axis] > 0 &&
        newPosition[axis] + this._orientationScaling[axis] / 2 >
          obj.mesh.position[axis] - obj._orientationScaling[axis] / 2
      ) {
        console.log(axis + " pos");
        this.mesh.position[axis] =
          obj.mesh.position[axis] -
          obj._orientationScaling[axis] / 2 -
          this._orientationScaling[axis] / 2;
      } else if (
        this._hitAxis[axis] < 0 &&
        newPosition[axis] - this._orientationScaling[axis] / 2 <
          obj.mesh.position[axis] + obj._orientationScaling[axis] / 2
      ) {
        console.log(axis + " neg");
        this.mesh.position[axis] =
          obj.mesh.position[axis] +
          obj._orientationScaling[axis] / 2 +
          this._orientationScaling[axis] / 2;
      }
    }
  }

  public onCollide(newPosition: Vector3, obj: GameObject): void {
    this.updateObjectOnAxis(newPosition, obj);
  }
}

type Axis = string;
export type Objects = Map<number, GameObject>;
