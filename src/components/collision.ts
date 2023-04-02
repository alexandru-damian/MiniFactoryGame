import { GameObject, HitAxis, Objects } from "./object";
import {Mesh, Vector3 } from "@babylonjs/core";

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

  public collides(newPostion: Vector3, currentObj: GameObject): void {
    let updatedMesh: Mesh = this.getUpdatedMesh(newPostion, currentObj);

    for (let [key, obj] of this._objects) {
      if (currentObj.mesh.id == String(key)) {
        continue;
      }

      if (updatedMesh.intersectsMesh(obj.mesh)) {
        currentObj.addObj(obj);
      }
    }

    console.log(currentObj.hitAxisObjs);
    if (currentObj.hitAxisObjs.size != 0) {
      currentObj.onCollide(newPostion);
    }

    currentObj.resetHitAxes();

    updatedMesh.dispose();
  }
}
