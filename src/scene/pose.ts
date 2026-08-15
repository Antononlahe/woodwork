import { Euler, Matrix4, Quaternion, Vector3 } from "three";
import type { Vec3 } from "../plan/types";
import { deg, zUpToYUp } from "./coords";

const B = new Matrix4().set(1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1);

export function assemblyPosition(at: Vec3): Vector3 {
  const [x, y, z] = zUpToYUp(at);
  return new Vector3(x, y, z);
}

export function assemblyQuaternion(rot?: Vec3): Quaternion {
  const r = rot ?? { x: 0, y: 0, z: 0 };
  const yamlR = new Matrix4().makeRotationFromEuler(new Euler(deg(r.x), deg(r.y), deg(r.z), "XYZ"));
  const threeR = new Matrix4().multiplyMatrices(B, yamlR).multiply(B.clone().invert());
  return new Quaternion().setFromRotationMatrix(threeR);
}
