import path from 'path'

import * as core from '@actions/core'

const { GITHUB_REPOSITORY, RUNNER_TOOL_CACHE } = process.env
const CWD = process.cwd()

export const STRATEGIES = ['copy-immutable', 'copy', 'move'] as const
export type Strategy = (typeof STRATEGIES)[number]

type Vars = {
  cacheDir: string
  cachePath: string[]
  options: {
    key: string
    path: string[]
    strategy: Strategy
  }
  targetDir: string[]
  targetPath: string[]
}

export const getVars = (): Vars => {
  if (!RUNNER_TOOL_CACHE) {
    throw new TypeError('Expected RUNNER_TOOL_CACHE environment variable to be defined.')
  }

  if (!GITHUB_REPOSITORY) {
    throw new TypeError('Expected GITHUB_REPOSITORY environment variable to be defined.')
  }

  const options = {
    key: core.getInput('key') || 'no-key',
    path: core.getInput('path').split('\n'),
    strategy: core.getInput('strategy') as Strategy,
  }

  if (options.path.length <= 0) {
    throw new TypeError('path is required but was not provided.')
  }

  if (!Object.values(STRATEGIES).includes(options.strategy)) {
    throw new TypeError(`Unknown strategy ${options.strategy}`)
  }

  const cacheDir = path.join(RUNNER_TOOL_CACHE, GITHUB_REPOSITORY, options.key)
  const cachePathList: string[] = []
  const targetPathList: string[] = []
  const targetDirList: string[] = []
  options.path.forEach((p) => {
    cachePathList.push(path.join(cacheDir, p))
    const targetPath = path.resolve(CWD, p)
    targetPathList.push(targetPath)
    const { dir: targetDir } = path.parse(targetPath)
    targetDirList.push(targetDir)
  })

  return {
    cacheDir,
    cachePath: cachePathList,
    options,
    targetDir: targetDirList,
    targetPath: targetPathList,
  }
}
