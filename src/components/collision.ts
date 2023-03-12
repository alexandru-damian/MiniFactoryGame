import { FeatureName, Mesh, Vector3 } from "@babylonjs/core";
import * as utils from "./utils";
import { GameObject, Objects } from "./object";

export enum FaceBox {
  Front = "F",
  Back = "B",
  Up = "U",
  Down = "D",
  Left = "L",
  Right = "R",
  Invalid = ""
}

export class Collision {
  private _objects: Objects;

  constructor(objects: Objects) {
    this._objects = objects;
  }

  public collides(
    currentObj: GameObject,
    onCollide: (currentMesh: Mesh, collidedMesh: Mesh) => void
  ): void {
    for (let [key, obj] of this._objects) {
      if (currentObj.mesh.id == String(key)) {
        continue;
      }

      if (currentObj.mesh.intersectsMesh(obj.mesh)) {
        onCollide(currentObj.mesh, obj.mesh);
        break;
      }
    }
  }

  public getBoundingBoxFace(delta: Vector3): FaceBox {
    let faces: Array<FaceBox> = new Array<FaceBox>();

    console.log("DELTAbox: " + delta);

    let face:FaceBox = FaceBox.Invalid;

    if (delta.x < -1) {
      face = FaceBox.Left;
    } else if (delta.x > 1) {
      face = FaceBox.Right;
    }

    if (delta.z < -1) {
        face = FaceBox.Back;
    } else if (delta.z > 1) {
        face = FaceBox.Front;
    }

    return face;
  }
}
