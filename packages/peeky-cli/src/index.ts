#!/usr/bin/env node
import { Command } from 'commander'

const program = new Command()
program.version(require('../package.json').version)

program.parse()
