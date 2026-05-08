import type * as mcx from '@mbler/mcx-core'

declare module '*.png' {
  export default mcx.PNGImageComponent
}
declare module '*.svg' {
  export default mcx.SVGImageComponent
}
declare module '*.jpg' {
  export default mcx.JPGImageComponent
}
declare module '*.jpeg' {
  export default mcx.JPGImageComponent
}
declare module '*.gif' {
  export default mcx.GIFImageComponent
}
