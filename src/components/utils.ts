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
