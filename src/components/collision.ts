import { GameConfig } from "../config/gameConfig";
import { GameObject, HitAxis, Objects } from "./object";
import { Mesh, Vector3 } from "@babylonjs/core";

export class Collision {
  private readonly _objects: Objects;
  private readonly PRECISION = 0.001;
  private readonly OFFSET: number =
    GameConfig._SIZE_GRID_CELL - GameConfig._SCALE_BOX + this.PRECISION +this.PRECISION;
  constructor(objects: Objects) {
    this._objects = objects;
  }

  private getUpdatedMesh(postion: Vector3, currentObj: GameObject): Mesh {
    let updatedMesh: Mesh = new Mesh("");
    updatedMesh.setBoundingInfo(currentObj.mesh.getBoundingInfo());
    updatedMesh.scaling = currentObj._orientationScaling.clone();
    updatedMesh.position = postion.clone();
    updatedMesh.computeWorldMatrix();

    return updatedMesh;
  }

  private calculateProjectionHitAxisPosition(
    newPosition: Vector3,
    currentObj: GameObject
  ): Vector3 {
    let currentPosition: Vector3 = newPosition.clone();

    for (let hitAxisObj of currentObj.hitAxesObjs) {
      if (
        !currentObj.isOppositeDirectionColliding(hitAxisObj[1], newPosition)
      ) {
        currentObj.hitAxesObjs.delete(hitAxisObj[0]);
      } else {
        currentPosition[hitAxisObj[1].axis] =
          currentObj.calulateHitPointOnAxis(hitAxisObj[1], hitAxisObj[0]);
      }
    }

    return currentPosition;
  }

  public calculateCollisions(
    newPosition: Vector3,
    currentObj: GameObject
  ): Vector3 {
    console.log(currentObj.mesh.position);
    let currentPosition: Vector3 = newPosition.clone();

    currentPosition = this.calculateProjectionHitAxisPosition(
      newPosition,
      currentObj
    );
    let updatedMesh: Mesh = this.getUpdatedMesh(currentPosition, currentObj);
    let hitAxes: HitAxis | undefined;

    for (let [key, obj] of this._objects) {
      if (currentObj.mesh.id == String(key)) {
        continue;
      }

      hitAxes = currentObj.hitAxesObjs.get(obj);

      if (updatedMesh.intersectsMesh(obj.mesh)) {
        currentObj.calculateHitAxis(currentPosition, obj);
      } else {
        if (hitAxes) {
          console.log("huh??");
          //currentObj.hitAxesObjs.delete(obj);
        }
      }
    }

    console.log(currentObj.hitAxesObjs);
    currentObj.onCollide(currentPosition);

    updatedMesh.dispose;
    return currentPosition;
  }
}
