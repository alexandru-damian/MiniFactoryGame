import { Mesh } from "@babylonjs/core";
import {Object, Objects} from "./object";

export class Collision
{
    private _objects: Objects;

    constructor(objects:Objects)
    {
        this._objects = objects;
    }

    public collides(object:Object, onCollide:()=>{}):void
    {

        for(let [key ,obj] of this._objects)
        {
            if(obj.mesh.id != String(key))
            {
                continue;
            }

            if(obj.mesh.intersectsMesh(obj.mesh))
            {
                onCollide();
                break;
            }
        }
    }
}