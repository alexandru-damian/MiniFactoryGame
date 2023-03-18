import { GameObject, Objects } from "./object";

export class Collision {
  private _objects: Objects;

  constructor(objects: Objects) {
    this._objects = objects;
  }

  public collides(
    currentObj: GameObject,
  ): void {
    for (let [key, obj] of this._objects) {
      if (currentObj.mesh.id == String(key)) {
        continue;
      }

      if (currentObj.mesh.intersectsMesh(obj.mesh)) {
        currentObj.onCollide(obj);
        break;
      }
    }
  }
}
