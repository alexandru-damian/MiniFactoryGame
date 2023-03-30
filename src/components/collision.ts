import { GameObject, Objects } from "./object";
import { Mesh, Vector3 } from "@babylonjs/core";

export class Collision {
  private _objects: Objects;

  constructor(objects: Objects) {
    this._objects = objects;
  }

  private getUpdatedMesh(postion:Vector3, currentObj:GameObject):Mesh
  {
    let updatedMesh:Mesh = currentObj.mesh.clone("current");
    updatedMesh.visibility = 0;
    updatedMesh.position = postion.clone();
    updatedMesh.computeWorldMatrix();

    return updatedMesh;
  }

  public collides(newPostion: Vector3, currentObj: GameObject): void {
    let hit:boolean = false;
    let updatedMesh:Mesh = this.getUpdatedMesh(newPostion, currentObj);
    

    for (let [key, obj] of this._objects) {
      if (currentObj.mesh.id == String(key)) {
        continue;
      }

      if (updatedMesh.intersectsMesh(obj.mesh)) {
        currentObj.onCollide(newPostion, obj);
        hit = true;
      }
    }
    if (!hit) {
      currentObj.resetHitAxes();
    }

    updatedMesh.dispose();
  }
}
