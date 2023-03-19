import { GameObject, Objects, FaceBox } from "./object";
import { Vector3 } from "@babylonjs/core";

export class HitAxis
{
  
  public x:number;
  public z:number;

  constructor()
  {
    this.reset();
  }

  reset()
  {
    console.log("Reset");
    this.x= 0;
    this.z= 0;
  }
}

export class Collision {
  private _objects: Objects;

  constructor(objects: Objects) {
    this._objects = objects;
  }

  public collides(newPostion: Vector3,
    currentObj: GameObject,
  ): void {
    for (let [key, obj] of this._objects) {
      if (currentObj.mesh.id == String(key)) {
        continue;
      }

      if (currentObj.mesh.intersectsMesh(obj.mesh)) {
        currentObj.onCollide(newPostion, obj);
        return;
      }
    }
    currentObj.hitAxis.reset();
  }
}



