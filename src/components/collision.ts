import { GameObject, Axis, HitAxisObjs, Objects, HitAxis } from "./object";
import { CurrentScreenBlock, Mesh, Vector3 } from "@babylonjs/core";
import * as utils from "./utils";
import { GameConfig } from "../config/gameConfig";

export class Collision {
  private readonly _objects: Objects;
  private readonly _OFFSET: number =
    GameConfig._SIZE_GRID_CELL - GameConfig._SCALE_BOX + 0.001;

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
    let updatedMesh: Mesh = new Mesh("");
    updatedMesh.visibility = 0;
    updatedMesh.setBoundingInfo(currentObj.mesh.getBoundingInfo());
    updatedMesh.scaling = currentObj._orientationScaling.clone();
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
    updatedMesh: Mesh
  ): boolean {
    let hitAxis = currentObj.hitAxisObjs.get(obj);

    if (currentObj.hitAxisObjs.size != 0 && hitAxis) {
      if (this.isCurrPosAboveObj(currentObj, hitAxis, newPos)) {
        newPos[hitAxis.axis] =
          currentObj.mesh.position[hitAxis.axis] +
          hitAxis.direction * this._OFFSET;
        updatedMesh.position = newPos.clone();
        updatedMesh.computeWorldMatrix();
      } else {
        return false;
      }
    }

    return updatedMesh.intersectsMesh(obj.mesh);
  }

  public calculateCollisions(
    newPosition: Vector3,
    currentObj: GameObject
  ): void {
    let updatedMesh: Mesh = this.getUpdatedMesh(newPosition, currentObj);
    let hit: boolean = false;
    for (let [key, obj] of this._objects) {
      if (currentObj.mesh.id == String(key)) {
        continue;
      }

      hit = this.objHits(newPosition, currentObj, obj, updatedMesh);
      if (hit) {
        currentObj.addObj(obj);
      } else {
        if (currentObj.hitAxisObjs.has(obj)) {
          currentObj.hitAxisObjs.delete(obj);
        }
      }
    }

    console.log(currentObj.hitAxisObjs);
    console.log(currentObj.mesh.position);

    if (currentObj.hitAxisObjs.size != 0) {
      currentObj.onCollide(newPosition);
    }

    updatedMesh.dispose;
  }
}
