import { GameObject, Objects } from "./object";
import { Vector3 } from "@babylonjs/core";

export class Collision {
  private _objects: Objects;

  constructor(objects: Objects) {
    this._objects = objects;
  }

  public collides(newPostion: Vector3, currentObj: GameObject): void {
    let hit:boolean = false;

    for (let [key, obj] of this._objects) {
      if (currentObj.mesh.id == String(key)) {
        continue;
      }

      if (currentObj.mesh.intersectsMesh(obj.mesh)) {
        currentObj.onCollide(newPostion, obj);
        hit = true;
      }
    }
      if(!hit){
      currentObj.resetHitAxes();
    }
  }
}
