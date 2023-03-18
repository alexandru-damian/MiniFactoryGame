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

export function delta(
  point1: Array<number>,
  point2: Array<number>
): Array<number> {
  let delta: Array<number> = new Array<number>();

  if (point1.length == point2.length) {
    for (let index = 0; index < point1.length; ++index) {
      delta.push(point1[index] - point2[index]);
    }
  }

  return delta;
}
