import { IPointerEvent, Mesh, Scene } from "@babylonjs/core";
import { Vector3, Color3, Tools } from "@babylonjs/core/";
import { HighlightLayer } from "@babylonjs/core";
import { GameConfig } from "../config/gameConfig";
import * as utils from "./utils";

export enum Rotation {
  RLEFT = 0,
  RRIGHT,
}

export class Object {
  private _mesh: Mesh;
  public _orientationScaling: Vector3;

  private _empty: boolean;
  private _highlightLayer: HighlightLayer;

  private _grabbed: boolean;
  constructor() {
    this.crateEmptyObject();
  }

  private crateEmptyObject() {
    this._empty = true;
    this._highlightLayer = new HighlightLayer("hl");
  }

  public get mesh() {
    return this._mesh;
  }

  public get grabbed(): boolean {
    return this._grabbed;
  }

  public set mesh(mesh: Mesh) {
    if (mesh.id == "") {
      return;
    }

    this._empty = false;

    this._mesh = mesh;
    if (!this._orientationScaling) {
      this._orientationScaling = mesh.scaling.clone();
    }
  }

  public cloneObjProperties(): Object {
    let newObj = new Object();

    newObj._empty = this._empty;
    newObj._mesh = this._mesh;
    newObj._orientationScaling = this._orientationScaling.clone();

    return newObj;
  }

  public isEmpty() {
    return this._empty;
  }
  public onFocus() {
    this._mesh.enableEdgesRendering();
    this._highlightLayer.addMesh(this._mesh, Color3.White(), true);
    this._grabbed = true;
  }

  public offFocus() {
    this._highlightLayer.removeMesh(this._mesh);
    this._mesh.disableEdgesRendering();
  }

  public rotate(direction: Rotation) {
    //Rotate object with 45 degrees
    const amount = Math.PI / 4;
    let isRightAngle = false;

    if (Math.abs(this._mesh.rotation.y) >= 2 * Math.PI) {
      this._mesh.rotation.y = 0;
    }

    switch (direction) {
      case Rotation.RLEFT: {
        this._mesh.rotation.y += amount;
        break;
      }
      case Rotation.RRIGHT: {
        this._mesh.rotation.y -= amount;
        break;
      }
      default: {
        break;
      }
    }
    let rotationDegree = Math.abs(Tools.ToDegrees(this._mesh.rotation.y));

    if (rotationDegree % 180 == 0) {
      isRightAngle = true;
      this._orientationScaling.x = this._mesh.scaling.x;
      this._orientationScaling.z = this._mesh.scaling.z;
    } else if (rotationDegree % 90 == 0) {
      isRightAngle = true;
      this._orientationScaling.x = this._mesh.scaling.z;
      this._orientationScaling.z = this._mesh.scaling.x;
    }

    if (!isRightAngle) {
      return;
    }

    if ((this._mesh.scaling.x + this._mesh.scaling.z) % 2 != 0) {
      let orientantionX = this._orientationScaling.x % 2 ? 1 : -1;
      let orientantionZ = this._orientationScaling.z % 2 ? 1 : -1;

      this.setX(
        this._mesh.position.x,
        orientantionX * GameConfig._SIZE_GRID_CELL
      );
      this.setZ(
        this._mesh.position.z,
        orientantionZ * GameConfig._SIZE_GRID_CELL
      );
    }
  }

  public setX(x: number, offset: number = GameConfig._SIZE_GRID_CELL) {
    this._mesh.position.x = utils.snapToGrid(
      x,
      this._orientationScaling.x,
      offset / 2
    );
  }

  public setZ(z: number, offset: number = GameConfig._SIZE_GRID_CELL) {
    this._mesh.position.z = utils.snapToGrid(
      z,
      this._orientationScaling.z,
      offset / 2
    );
  }

  public setY(y: number, offset: number = GameConfig._SIZE_GRID_CELL) {
    this._mesh.position.y =
      utils.snapToGrid(
        y,
        this._orientationScaling.y,
        offset / 2,
        true
      );
  }

  public onDrop() {
    this._mesh.visibility = 1;

    this.setX(this._mesh.position.x);
    this.setZ(this._mesh.position.z);
    this.setY(this._mesh.position.y);

    this._grabbed = false;
  }
}
