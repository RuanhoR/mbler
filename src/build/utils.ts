export default function next(tip: string) {
  process.stdout.write("\r" + tip)
}