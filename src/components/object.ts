import { Mesh, Vector2 } from "@babylonjs/core";
import { Vector3, Color3, Tools } from "@babylonjs/core/";
import { HighlightLayer } from "@babylonjs/core";
import { GameConfig } from "../config/gameConfig";
import * as utils from "./utils";

export enum Rotation {
  RLEFT = 0,
  RRIGHT,
}

interface HitAxis {
  axis: Axis;
  direction: number;
  value: number;
}

export class GameObject {
  private _mesh: Mesh;
  public _orientationScaling: Vector3;
  private _hitAxes: Map<Axis, number>;
  private readonly AXES: Axis[] = ["x", "z"];

  private _empty: boolean;
  private _highlightLayer: HighlightLayer;

  private _grabbed: boolean;
  constructor() {
    this.crateEmptyObject();
  }

  private crateEmptyObject() {
    this._empty = true;
    this._highlightLayer = new HighlightLayer("hl");
    this._hitAxes = new Map<Axis, number>();
  }

  public get mesh() {
    return this._mesh;
  }

  public get hitAxes() {
    return this._hitAxes;
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

  public resetHitAxes(): void {
    this._hitAxes.clear();
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
    this.resetHitAxes();
  }

  private isOutOfBounds(
    hitAxis: [Axis, number],
    newPosition: Vector3
  ): boolean {
    return (
      (hitAxis[1] > 0 &&
        newPosition[hitAxis[0]] < this.mesh.position[hitAxis[0]]) ||
      (hitAxis[1] < 0 &&
        newPosition[hitAxis[0]] > this.mesh.position[hitAxis[0]])
    );
  }

  private updateObjectOnAxis(newPosition: Vector3, obj: GameObject): void {
    console.log("hit");
    console.log(this.mesh.position);

    let updatedAxis: HitAxis = { axis: "", direction: 0, value: 0 };
    let direction: number;

    for (let axis of this.AXES) {
      direction = utils.calculateDirection(
        this.mesh.position[axis],
        newPosition[axis]
      );
      updatedAxis = this.updateClosestAxis(updatedAxis, axis, direction, obj);
      console.log(updatedAxis);
    }

    console.log(updatedAxis);

    // for (let hitAxis of this.hitAxes) {
    //   if (this.isOutOfBounds(hitAxis, newPosition)) {
    //     console.log("I'm out");
    //     this.hitAxes.delete(hitAxis[0])
    //   }
    // }

    if (updatedAxis.axis != "" && updatedAxis.direction != 0) {
      this._hitAxes.set(updatedAxis.axis, updatedAxis.direction);
    }
    this.updateWallPointOnAxis(updatedAxis, newPosition, obj);
  }

  private updateClosestAxis(
    updatedAxis: HitAxis,
    axis: Axis,
    direction: number,
    obj: GameObject
  ): HitAxis {
    let newHittedAxis: HitAxis = { axis: axis, direction: direction, value: 0 };

    let diffA: number = this.findCollidedSize(updatedAxis, obj);
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

  private updateWallPointOnAxis(
    test: HitAxis,
    newPosition: Vector3,
    obj: GameObject
  ): void {
    let currentHitAxis: HitAxis = { axis: "", direction: 0, value: 0 };
    // for (let hitAxis of this._hitAxes) {
    //   currentHitAxis = this.updateClosestAxis(
    //     currentHitAxis,
    //     hitAxis[0],
    //     hitAxis[1],
    //     obj
    //   );
    // }

    currentHitAxis = test;
    if (currentHitAxis.direction == 0) {
      return;
    }

    if (
      currentHitAxis.direction > 0 &&
      newPosition[currentHitAxis.axis] +
        this._orientationScaling[currentHitAxis.axis] / 2 >
        obj.mesh.position[currentHitAxis.axis] -
          obj._orientationScaling[currentHitAxis.axis] / 2
    ) {
      newPosition[currentHitAxis.axis] =
        obj.mesh.position[currentHitAxis.axis] -
        obj._orientationScaling[currentHitAxis.axis] / 2 -
        this._orientationScaling[currentHitAxis.axis] / 2;
    } else 
      {
      newPosition[currentHitAxis.axis] =
        obj.mesh.position[currentHitAxis.axis] +
        obj._orientationScaling[currentHitAxis.axis] / 2 +
        this._orientationScaling[currentHitAxis.axis] / 2;
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
