export function snapToGrid(
    axis: number,
    size: number,
    offsetAxis: number = 0,
    snapToY: boolean = false
  ):number {
    let result = Math.round(axis);

    if (size % 2 == 0) {
      let sign = axis < 0 ? -1 : 1;
      return Math.trunc(axis) + offsetAxis * sign;
    }

    return result;
  }