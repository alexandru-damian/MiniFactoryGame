export function snapToGrid(
  axis: number,
  size: number,
  offsetAxis: number = 0
): number {
  let result = Math.round(axis);

  if (size % 2 == 0) {
    return Math.trunc(axis) + offsetAxis * sign(axis);
  }

  return result;
}

export function sign(x: number): number {
  let sign: number = Math.sign(x);

  if (sign == 0) {
    return 1;
  }

  return sign;
}

export function calculateDeltaSize(objA: ObjProps, objB: ObjProps): number {
  return Math.abs(objA[0] - objA[1] / 2 - (objB[0] + objB[1] / 2));
}

export function calculateDirection(
  previousPos: number,
  newPosition: number
): number {
  if (previousPos < newPosition) {
    return 1;
  }
  return -1;
}

export type ObjProps = [positionAxis: number, scaleAxis: number];
