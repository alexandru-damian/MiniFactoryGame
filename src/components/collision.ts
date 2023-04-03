import { GameObject, Axis, HitAxisObjs, Objects, HitAxis } from "./object";
import { Mesh, Vector3 } from "@babylonjs/core";
import * as utils from "./utils";

export class Collision {
  private _objects: Objects;

  constructor(objects: Objects) {
    this._objects = objects;
  }

  private getUpdatedMesh(postion: Vector3, currentObj: GameObject): Mesh {
    let updatedMesh: Mesh = currentObj.mesh.clone("current");
    updatedMesh.visibility = 0;
    updatedMesh.position = postion.clone();
    updatedMesh.computeWorldMatrix();

    console.log(currentObj.mesh.position);
    console.log(updatedMesh.position);

    return updatedMesh;
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

  private isDirectionOpposite(
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
    let updatedMesh: Mesh = this.getUpdatedMesh(newPosition, currentObj);
    let hitAxisObjs: HitAxisObjs = currentObj.hitAxisObjs;

    for (let [key, obj] of this._objects) {
      if (currentObj.mesh.id == String(key)) {
        continue;
      }
      console.log("x " + newPosition.x);

      if (updatedMesh.intersectsMesh(obj.mesh)) {
        currentObj.addObj(obj);
      } else {
        if (
          !currentObj.mesh.intersectsMesh(obj.mesh) ||
          this.isDirectionOpposite(
            currentObj,
            hitAxisObjs.get(obj),
            newPosition
          )
        ) {
          hitAxisObjs.delete(obj);
        }
      }
    }

    console.log(currentObj.hitAxisObjs);
    if (currentObj.hitAxisObjs.size != 0) {
      currentObj.onCollide(newPosition);
    }

    updatedMesh.dispose();
  }
}
