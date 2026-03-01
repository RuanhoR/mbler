
export const loger = {
  d(msg) {
    console.log(`[WARNING] ${msg}`)
  },
  e(error) {
    if (!error.stack || !error.message || !error.name) {
      console.error(`${error.name} : ${error.stack}`)
    }
  },
  w(msg) {
    console.warn(msg)
  }
}
export const emtpyloger = {
  d() {},
  e() {},
  w() {}
}