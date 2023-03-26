import { Vector3 } from "@babylonjs/core";
import { GameObject } from "./object";
import * as utils from "./utils";

export interface HitAxis {
  axis: Axis;
  direction: number;
}

export class PhysicalObject extends GameObject {
  private _hitAxis: HitAxis;

  public get hitAxis() {
    return this._hitAxis;
  }

  constructor()
  {
    super();
    this._hitAxis = { axis: "", direction: 0 };
  }

  public resetHitAxis(): void {
    this._hitAxis.axis = "";
    this._hitAxis.direction = 0;
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

      direction = this.calculateDirection(axis, newPosition[axis]);
      this.updateClosestAxis(axis, direction, obj);
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
      if (
        this._hitAxis.direction > 0 &&
        this.mesh.position[this._hitAxis.axis]
      ) {
        console.log(this._hitAxis.axis + " pos");
        newPosition[this._hitAxis.axis] =
          obj.mesh.position[this._hitAxis.axis] -
          obj._orientationScaling[this._hitAxis.axis] / 2 -
          this._orientationScaling[this._hitAxis.axis] / 2;
      } else if (this._hitAxis.direction < 0) {
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
