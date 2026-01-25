export default function next(tip: string) {
  process.stdout.write(`\r[${new Date}] ${tip}`)
}