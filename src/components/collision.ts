import { GameObject, Axis, HitAxisObjs, Objects, HitAxis } from "./object";
import { Mesh, Vector3 } from "@babylonjs/core";
import * as utils from "./utils";

export class Collision {
  private readonly _objects: Objects;

  constructor(objects: Objects) {
    this._objects = objects;
  }

  public axisDirectionIsAboveObjPos(
    currentHitAxis: HitAxis,
    newDirection: number,
    newPosition: Vector3,
    currentObj: GameObject
  ): boolean {
    return (
      (currentHitAxis.direction > 0 &&
        newDirection > 0 &&
        newPosition[currentHitAxis.axis] >
          currentObj.mesh.position[currentHitAxis.axis]) ||
      (currentHitAxis.direction < 0 &&
        newDirection < 0 &&
        newPosition[currentHitAxis.axis] <
          currentObj.mesh.position[currentHitAxis.axis])
    );
  }

  private getUpdatedMesh(postion: Vector3, currentObj: GameObject): Mesh {
    let updatedMesh: Mesh = currentObj.mesh.clone("current");
    updatedMesh.visibility = 0;
    updatedMesh.position = postion.clone();
    updatedMesh.computeWorldMatrix();

    return updatedMesh;
  }

  private isCurrPosAboveObj(
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

    let test = this.axisDirectionIsAboveObjPos(
      currentHitAxis,
      direction,
      newPosition,
      currentObj
    );

    return test;
  }

  private objHits(
    newPos: Vector3,
    currentObj: GameObject,
    obj: GameObject,
    updatedMesh:Mesh
  ): boolean {
    let projectionPos: Vector3;
    let hitAxis = currentObj.hitAxisObjs.get(obj);
    if (updatedMesh.intersectsMesh(obj.mesh)) {
      return true;
    }

    if (!hitAxis) {
      return false;
    }

    projectionPos = newPos.clone();
    projectionPos[hitAxis.axis] = currentObj.mesh.position[hitAxis.axis];
    updatedMesh = this.getUpdatedMesh(projectionPos, currentObj).clone();

    return (
      updatedMesh.intersectsMesh(obj.mesh) &&
      this.isCurrPosAboveObj(currentObj, hitAxis, newPos)
    );
  }

  public calculateCollisions(
    newPosition: Vector3,
    currentObj: GameObject
  ): void {
    let updatedMesh: Mesh = this.getUpdatedMesh(newPosition, currentObj).clone();
    let hit: boolean;

    for (let [key, obj] of this._objects) {
      hit = false;

      if (currentObj.mesh.id == String(key)) {
        continue;
      }

      if (this.objHits(newPosition, currentObj, obj,updatedMesh)) {
        currentObj.addObj(obj);
      } else {
        currentObj.hitAxisObjs.delete(obj);
      }
    }

    if (currentObj.hitAxisObjs.size != 0) {
      currentObj.onCollide(newPosition);
    }

    updatedMesh.dispose
  }
}
