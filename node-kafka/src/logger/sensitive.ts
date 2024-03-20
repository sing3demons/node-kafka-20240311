import ignoreCase from './ignore'

interface ISensitive {
  maskNumber(mobileNo: string, mask?: string): string
  maskEmail(email: string): string
  maskPassword(password: string): string
  masking(item: any): void
}

const Sensitive: ISensitive = {
  maskNumber: (mobileNo: string, mask?: string): string => {
    let maskData = 'XXX-XXX-XX'
    if (mask) {
      maskData = maskData.replace(/X/g, mask)
    }
    if (ignoreCase.startWith(mobileNo, '+')) {
      if (mobileNo.length >= 10) {
        return `${maskData}${mobileNo.substring(mobileNo.length - 2, mobileNo.length)}`
      }
    } else if (ignoreCase.startWith(mobileNo, '0') && mobileNo.length >= 10) {
      return `${maskData}${mobileNo.substring(mobileNo.length - 2, mobileNo.length)}`
    }

    return mobileNo
  },
  maskEmail: (email: string): string => {
    const rex = new RegExp(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/)
    if (!rex.test(email)) {
      return email
    } else {
      let [first, second] = email.split('@')
      if (first.length > 2) {
        const mask = first.substring(3, first.length)
        const notMask = first.substring(0, 3)
        first = notMask + 'X'.repeat(mask.length)
      } else {
        first = first.replace(first.substring(1, first.length), 'X'.repeat(first.length - 1))
      }
      return `${first}@${second}`
    }
  },
  maskPassword: (password: string): string => password.replace(password, '********'),
  masking: (item: any) => {
    for (const key in item) {
      if (ignoreCase.equal(key, 'password')) {
        item[key] = Sensitive.maskPassword(item[key])
      } else if (ignoreCase.equal(key, 'email')) {
        item[key] = Sensitive.maskEmail(item[key])
      } else if (ignoreCase.equal(key, 'mobileNo')) {
        item[key] = Sensitive.maskNumber(item[key])
      } else if (ignoreCase.equal(key, 'phone')) {
        item[key] = Sensitive.maskNumber(item[key])
      } else if (typeof item[key] === 'object') {
        Sensitive.masking(item[key])
      }
    }
  },
}

export default Sensitive
