import { setFailed, setOutput } from '@actions/core'
import { mkdirP, mv, cp, rmRF } from '@actions/io/'
import { exists } from '@actions/io/lib/io-util'

import { getVars } from './lib/getVars'
import { isErrorLike } from './lib/isErrorLike'
import log from './lib/log'

async function main(): Promise<void> {
  try {
    const vars = getVars()
    for (let i = 0; i < vars.cachePath.length; i++) {
      const cachePath = vars.cachePath[i]
      const targetDir = vars.targetDir[i]
      const targetPath = vars.targetPath[i]
      const options = vars.options as { strategy: 'copy-immutable' | 'copy' | 'move' }
      if (await exists(cachePath)) {
        await mkdirP(targetDir)

        switch (options.strategy) {
          case 'copy-immutable':
          case 'copy':
            await rmRF(targetPath)
            await cp(cachePath, targetPath, {
              copySourceDirectory: false,
              recursive: true,
            })
            break
          case 'move':
            await rmRF(targetPath)
            await mv(cachePath, targetPath, { force: true })
            break
        }

        log.info(
          `Cache found and restored from ${targetPath} to ${cachePath} with ${options.strategy} strategy`
        )
        setOutput('cache-hit', true)
      } else {
        log.info(`Skipping: cache not found for ${cachePath}.`)
        setOutput('cache-hit', false)
      }
    }
  } catch (error: unknown) {
    console.trace(error)
    setFailed(isErrorLike(error) ? error.message : `unknown error: ${error}`)
  }
}

void main()
