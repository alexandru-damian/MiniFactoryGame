import {Mesh} from '@babylonjs/core/Meshes/mesh'
import {Vector3} from '@babylonjs/core/'

class Object {
    private mesh: Mesh;
    public orientationScales: Vector3;
  
    private empty: boolean;
  
    constructor() {
      this.crateEmptyObject();
      return;
    }
  
    private crateEmptyObject() {
      this.empty = true;
    }
  
    public getMesh() {
      return this.mesh;
    }
  
    public setMesh(mesh: Mesh) {
      if (mesh.id == "") {
        return;
      }
  
      this.empty = false;
  
      this.mesh = mesh;
      if (!this.orientationScales) {
        this.orientationScales = mesh.scaling.clone();
      }
    }
  
    public cloneObjProperties(): Object {
      let newObj = new Object();
  
      newObj.empty = this.empty;
      newObj.mesh = this.mesh;
      newObj.orientationScales = this.orientationScales.clone();
  
      return newObj;
    }
  
    public isEmpty() {
      return this.empty;
    }
  }