export class Vector3 {
  constructor(x1, y1, z1, dimension) {
    const x = x1 || 0;
    const y = y1 || 0;
    const z = z1 || 0;
    const dis = typeof dimension === "object" ? (dimension.id || "overworld") : ([
      'overworld',
      'nether',
      'the_end'
    ].includes(dimension) ? dimension : null)
    return {
      dis,
      x,
      y,
      z
    }
  }
}