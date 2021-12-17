import chalk from 'chalk'
import { isWindows } from './env.js'

export function italic (text: string) {
  if (isWindows) {
    return text
  }
  return chalk.italic(text)
}
