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

const Kuroshiro = require('kuroshiro')
const KuromojiAnalyzer = require('kuroshiro-analyzer-kuromoji')
const wanakana = require('wanakana')

const smallKanas = 'ぁぃぅぇぉゃゅょ'

// 辞書のローディング。
const kuroshiro = new Kuroshiro()
const loaded = kuroshiro.init(new KuromojiAnalyzer())

exports.state = Object.freeze({
  CONTINUE: 0,
  LOSE_N: 1,
  WIN_N: 2,
  LOSE_USED: 3,
  WIN_USED: 4,
  LOSE_CHAIN: 5
})

// https://github.com/hexenq/kuroshiro/issues/64
async function toHiragana (word) {
  const hira = await kuroshiro.convert(word, { to: 'hiragana' })
  return wanakana.toHiragana(hira)
}

// しりとりのルールのチェック。
exports.check = (word, chain) => loaded.then(async () => {
  // 「ん」で終わるかどうか？
  const wordHira = await toHiragana(word)
  if (wordHira[wordHira.length - 1] === 'ん') {
    return exports.state.LOSE_N
  }

  // 漢字からひらがなにする。
  if ((chain === undefined) || (chain.length === 0)) {
    return exports.state.CONTINUE
  }

  // 使った名詞をチェックする。
  const chainHira = await Promise.all(chain.map(toHiragana))
  if (chainHira.includes(wordHira)) {
    return exports.state.LOSE_USED
  }

  // しりとりの最初の文字をチェックする。
  const validKanas = await exports.kanas(chain[0])
  for (const k of validKanas) {
    const begin = wordHira.slice(0, k.length)
    if (begin === k) {
      return exports.state.CONTINUE
    }
  }
  return exports.state.LOSE_CHAIN
})

// 名詞からしりとりのひらがなを選ぶ。
exports.kanas = word => loaded.then(async () => {
  const wordKana = await kuroshiro.convert(word, { to: 'katakana' })
  const wordHira = wanakana.toHiragana(wordKana)
  const kk = wordKana[wordKana.length - 1]
  const hk = wordHira[wordHira.length - 1]

  if (hk === 'ん') {
    return []
  }

  // サー→「さ、あ」。
  if ((kk === 'ー') && (wordKana.length > 1)) {
    return [
      wordHira[wordHira.length - 1],
      wordHira[wordHira.length - 2]
    ]
  }

  // しゃ→「しゃ、や」。
  if (smallKanas.includes(hk)) {
    return [
      String.fromCharCode(hk.charCodeAt(0) + 1),
      wordHira.slice(-2)
    ]
  }

  // 最後の文字。
  return [
    wordHira[wordHira.length - 1]
  ]
}).then(result => new Set(result))

// しりとりのゲームループ。
exports.interact = async (dict, word, chain) => {
  const result = await exports.check(word, chain)
  if (result !== exports.state.CONTINUE) {
    return { state: result }
  }
  const validKanas = await exports.kanas(word)
  // 他のかなもチェックしたほうかいい。
  const firstValidKana = validKanas.values().next().value
  const words = await dict(firstValidKana)
  const unused = words ? Object.keys(words).filter(k => !chain.includes(words[k])) : []
  if (unused.length === 0) {
    return { state: exports.state.WIN_USED }
  }
  // ランダムでえらぶ。
  const w = unused[Math.floor(Math.random() * unused.length)]
  const wk = words[w]
  if (wk[wk.length - 1] === 'ん') {
    return { state: exports.state.WIN_N, word: w, kana: wk }
  }
  return { state: exports.state.CONTINUE, word: w, kana: wk }
}
