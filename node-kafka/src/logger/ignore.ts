const ignoreCase: IgnoreCase = {
  equal: (a?: string, b?: string) => {
    if (a === undefined || b === undefined) {
      return false
    }
    return a.toLowerCase() === b.toLowerCase()
  },
  notEqual: (a: string, b: string) => a.toLowerCase() !== b.toLowerCase(),
  contain: (a: string, b: string) => a.toLowerCase().includes(b.toLowerCase()),
  notContain: (a: string, b: string) => !a.toLowerCase().includes(b.toLowerCase()),
  startWith: (a: string, b: string) => a.toLowerCase().startsWith(b.toLowerCase()),
}

interface IgnoreCase {
  equal(a: string, b: string): boolean
  notEqual(a: string, b: string): boolean
  contain(a: string, b: string): boolean
  notContain(a: string, b: string): boolean
  startWith(a: string, b: string): boolean
}

export default ignoreCase
