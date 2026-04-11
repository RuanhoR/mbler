export interface Logger {
  d(msg: string): void;
  e(error: Error | any): void;
  w(msg: string): void;
}

export const loger: Logger = {
  d(msg: string) {
    console.log(`[WARNING] ${msg}`)
  },
  e(error: any) {
    if (!error.stack || !error.message || !error.name) {
      console.error(`${error.name} : ${error.stack}`)
    }
  },
  w(msg: string) {
    console.warn(msg)
  }
}

export const emtpyloger: Logger = {
  d() {},
  e() {},
  w() {}
}