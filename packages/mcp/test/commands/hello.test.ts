import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('hello', () => {
  it('greets the supplied name', async () => {
    const {stdout} = await runCommand('hello Ada')
    expect(stdout).to.equal('Hello, Ada!\n')
  })

  it('supports uppercase JSON output', async () => {
    const {stdout} = await runCommand('hello Ada --uppercase --json')
    expect(stdout).to.equal('{"greeting":"Hello","name":"Ada","message":"HELLO, ADA!"}\n')
  })
})
