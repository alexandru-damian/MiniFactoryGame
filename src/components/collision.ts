import { GameObject, Axis, HitAxisObjs, Objects, HitAxis } from "./object";
import { Mesh, Vector3 } from "@babylonjs/core";
import * as utils from "./utils";

export class Collision {
  private _objects: Objects;

  constructor(objects: Objects) {
    this._objects = objects;
  }

  public isOutOfBounds(
    currentHitAxis: HitAxis,
    newDirection: number,
    newPosition: Vector3,
    currentObj: GameObject
  ): boolean {
    return (
      (currentHitAxis.direction > 0 &&
        newDirection < 0 &&
        newPosition[currentHitAxis.axis] <
          currentObj.mesh.position[currentHitAxis.axis]) ||
      (currentHitAxis.direction < 0 &&
        newDirection > 0 &&
        newPosition[currentHitAxis.axis] >
          currentObj.mesh.position[currentHitAxis.axis])
    );
  }

  private isDirectionChanged(
    currentObj: GameObject,
    hitAxis,
    newPosition: Vector3
  ): boolean {
    if (!hitAxis) {
      return false;
    }
    let currentHitAxis: HitAxis = hitAxis;

    let direction: number = utils.calculateDirection(
      currentObj.mesh.position[currentHitAxis.axis],
      newPosition[currentHitAxis.axis]
    );

    let test = this.isOutOfBounds(
      currentHitAxis,
      direction,
      newPosition,
      currentObj
    );

    return test;
  }

  public calculateCollisions(
    newPosition: Vector3,
    currentObj: GameObject
  ): void {
    let hitAxisObjs: HitAxisObjs = currentObj.hitAxisObjs;

    let updated: boolean = false;

    for (let [key, obj] of this._objects) {
      if (currentObj.mesh.id == String(key)) {
        continue;
      }
      console.log("x " + newPosition.x);
      if (
        currentObj.mesh.intersectsMesh(obj.mesh) &&
        !this.isDirectionChanged(currentObj, hitAxisObjs.get(obj), newPosition)
      ) {
        let hitAxis = hitAxisObjs.get(obj);
        currentObj.addObj(obj);
      } else {
        currentObj.hitAxisObjs.delete(obj);
      }
    }

    console.log(hitAxisObjs);
    if (hitAxisObjs.size != 0) {
      currentObj.onCollide(newPosition);
    }
  }
}
