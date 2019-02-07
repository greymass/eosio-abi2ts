#!/usr/bin/env ts-node

import {ArgumentParser} from 'argparse'
import {createReadStream, createWriteStream} from 'fs'

import transform from './index'
import version from './version'

interface Arguments {
    input?: string
    prefix?: string
    indent: number
    pascal_case: boolean
    camel_case: boolean
    snake_case: boolean
    use_tabs: boolean
    output?: string
    export: boolean
}

const parser = new ArgumentParser({version, addHelp: true})

parser.addArgument(['-i', '--input'], {
    help: 'Read ABI JSON from file instead of stdin.',
    type: String,
})

parser.addArgument(['-p', '--prefix'], {
    help: 'Prefix to add to every type.',
    type: String,
})

parser.addArgument(['-n', '--indent'], {
    defaultValue: 4,
    help: 'How many spaces or tabs to indend with.',
    type: Number,
})

parser.addArgument(['-t', '--use-tabs'], {
    action: 'storeTrue',
    defaultValue: false,
    help: 'Use tabs instead of spaces for indentation.',
})

parser.addArgument(['-e', '--export'], {
    action: 'storeTrue',
    defaultValue: false,
    help: 'Whether to export interfaces and types.',
})

const group = parser.addMutuallyExclusiveGroup()

group.addArgument(['-a', '--pascal-case'], {
    action: 'storeTrue',
    defaultValue: false,
    help: 'Format types using PascalCase (default).',
})

group.addArgument(['-c', '--camel-case'], {
    action: 'storeTrue',
    defaultValue: false,
    help: 'Format types using camelCase.',
})

group.addArgument(['-s', '--snake-case'], {
    action: 'storeTrue',
    defaultValue: false,
    help: 'Format types using snake_case.',
})

parser.addArgument(['output'], {
    help: 'Output file to write to instead of stdout.',
    nargs: '?',
    type: String,
})

const args = parser.parseArgs() as Arguments

let typeFormatter = snakeToPascal
if (args.snake_case) {
    typeFormatter = anyToSnake
} else if (args.camel_case) {
    typeFormatter = snakeToCamel
}
if (args.prefix) {
    const fmt = typeFormatter
    typeFormatter = (name: string) => args.prefix + fmt(name)
}

const indentChar = args.use_tabs ? '\t' : ' '
const indent = indentChar.repeat(args.indent)

const input = args.input ? createReadStream(args.input) : process.stdin
const output: any = args.output ? createWriteStream(args.output) : process.stdout

const chunks: Buffer[] = []
input.on('error', (error) => {
    process.stderr.write(`Error reading input: ${ error.message }`)
    process.exit(1)
})
input.on('data', (chunk) => { chunks.push(chunk) })
input.on('end', () => {
    try {
        const data = Buffer.concat(chunks)
        const abi = JSON.parse(data.toString('utf8'))
        const lines = transform(abi, {indent, typeFormatter, export: args.export})
        for (const line of lines) {
            output.write(line + '\n')
        }
        output.end()
    } catch (error) {
        process.stderr.write(`Error transforming abi: ${ error.message }`)
        process.exit(1)
    }
})

/** Return PascalCase version of snake_case string. */
function snakeToPascal(name: string): string {
    return name.split('_').map((v) => (v[0] ? v[0].toUpperCase() : '_') + v.slice(1)).join('')
}

/** Return camelCase version of snake_case string. */
function snakeToCamel(name: string): string {
    const pascal = snakeToPascal(name)
    return pascal[0].toLowerCase() + pascal.slice(1)
}

/** Return snake_case version of PascalCase or camelCase string. */
function anyToSnake(name: string): string {
    return name.replace(/[A-Z]/g, (m, i) => (i !== 0 ? '_' : '') + m.toLowerCase())
}
