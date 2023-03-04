import {Mesh} from '@babylonjs/core/Meshes/mesh'
import {Vector3} from '@babylonjs/core/'

export class Object {
    private _mesh: Mesh;
    public _orientationScaling: Vector3;
  
    private _empty: boolean;
  
    constructor() {
      this.crateEmptyObject();
      return;
    }
  
    private crateEmptyObject() {
      this._empty = true;
    }
  
    public get mesh() {
      return this._mesh;
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
  }