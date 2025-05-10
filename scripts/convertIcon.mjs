#!/usr/bin/env zx
/* eslint-disable no-undef */

// Convert SVG icons (from Figma) for <Icon/> component
// - Remove width and height attributes
// - Remove white background
// - Replace fill="black" with fill="currentColor"

import 'zx/globals'

import { readFile, writeFile } from 'fs/promises'

async function convert(fileName) {
  const svg = (await readFile(fileName, 'utf-8'))
    .replace(/<svg width="\d+" height="\d+"/, '<svg')
    .replace(/<rect width="\d+" height="\d+" fill="white"\/>\n/, '')
    .replaceAll('black', 'currentColor')

  await writeFile(fileName, svg)
}

await Promise.all(argv._.map(convert))
