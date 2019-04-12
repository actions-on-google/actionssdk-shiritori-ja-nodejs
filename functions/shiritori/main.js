#!/usr/bin/env node
//
// Copyright 2018, Google, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict'

const shiritori = require('./index')

const process = require('process')
const readline = require('readline')
const corpus = require('./corpus.json')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const chain = ['しりとり']
console.log(chain[0])
rl.prompt()
rl.on('line', async input => {
  const result = await shiritori.interact(
    kana => Promise.resolve(corpus[kana]),
    input, chain
  )
  switch (result.state) {
    case shiritori.state.CONTINUE:
      console.log(`${result.word} [${result.kana}]`)
      chain.unshift(input)
      chain.unshift(result.kana)
      rl.prompt()
      break
    case shiritori.state.LOOSE_N:
    case shiritori.state.LOOSE_USED:
    case shiritori.state.LOOSE_CHAIN:
      console.log('ざんねん。')
      process.exit(-1)
    case shiritori.state.WIN_N:
    case shiritori.state.WIN_USED:
      console.log('すごい！')
      process.exit(0)
  }
})
