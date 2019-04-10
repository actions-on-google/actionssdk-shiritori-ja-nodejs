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

class Win extends Error {}
exports.Win = Win
class Bad extends Error {}
exports.Bad = Bad

// しりとりのルールのチェック。
exports.check = (word, chain) => loaded.then(() => {
  return Promise.all([
    kuroshiro.convert(word, { to: 'hiragana' }),
    ...chain.map(e => kuroshiro.convert(e, { to: 'hiragana' }))
  ]).then(([word, ...chain]) => {
    // 漢字からひらがなにする。
    const wordHira = wanakana.toHiragana(word)
    if (wordHira[wordHira.length - 1] === 'ん') {
      throw new Bad('ends with ん')
    }

    if ((chain === undefined) || (chain.length === 0)) {
      return true
    }

    // 使った名詞をチェックする。
    const chainHira = chain.map(wanakana.toHiragana)
    if (chainHira.indexOf(wordHira, 0) !== -1) {
      throw new Bad('already used')
    }

    // しりとりの最初の文字をチェックする。
    return exports.kanas(chain[0]).then(validKanas => {
      for (const k of validKanas) {
        const begin = wordHira.slice(0, k.length)
        if (begin === k) {
          return true
        }
      }
      throw new Bad('文字 does not match')
    })
  })
})

// 名詞からしりとりのひらがなを選ぶ。
exports.kanas = word => loaded
  .then(() => kuroshiro.convert(word, { to: 'hiragana' }))
  .then((word) => {
    const wordKana = wanakana.toKatakana(word)
    const wordHira = wanakana.toHiragana(wordKana)
    const kk = wordKana[wordKana.length - 1]
    const hk = wordHira[wordHira.length - 1]

    if (hk === 'ん') {
      return []
    }

    if ((kk === 'ー') && (wordKana.length > 1)) {
      return [
        wordHira[wordHira.length - 1],
        wordHira[wordHira.length - 2]
      ]
    }

    if (smallKanas.includes(hk)) {
      return [
        String.fromCharCode(hk.charCodeAt(0) + 1),
        wordHira.slice(-2)
      ]
    }
    return [
      wordHira[wordHira.length - 1]
    ]
  })
  .then(result => new Set(result))

// しりとりのゲームループ。
exports.interact = (dict, word, chain) => exports.check(word, chain)
    .then(() => exports.kanas(word))
    .then(validKanas => dict(validKanas.values().next().value))
    .then(words => {
      const unused = words ? Object.keys(words).filter(k => !chain.includes(words[k])) : []
      if (unused.length === 0) {
        throw new Win('no more unused word remaining in dictionary')
      }
      const w = unused[Math.floor(Math.random() * unused.length)]
      const wk = words[w]
      if (wk.length === 0) {
        throw new Error(`no dictionary entry for key: ${w}`)
      }
      if (wk[wk.length - 1] === 'ん') {
        throw new Win('dictionary word ends with ん')
      }
      return { word: w, kana: wk }
    })
