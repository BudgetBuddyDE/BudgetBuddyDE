import {Hook} from '@oclif/core'
import {printBanner} from '../banner'

const hook: Hook.Init = async function ({argv, id}) {
  // Keep command output, JSON output, and automated tests free of decoration.
  if (id !== undefined || process.env.NODE_ENV === 'test' || argv.includes('--json')) return
  printBanner()
}

export default hook
