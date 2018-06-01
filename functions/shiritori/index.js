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

const kuroshiro = require('kuroshiro')
const wanakana = require('wanakana')

const smallKanas = 'ぁぃぅぇぉゃゅょ'
let kuroshiroLoaded = false

// 辞書のローディング。
exports.loaded = new Promise((resolve, reject) => {
  kuroshiro.init(function (err) {
    if (err) {
      reject(err)
      return
    }
    kuroshiroLoaded = true
    resolve()
  })
})

// しりとりのルールのチェック。
exports.check = (word, chain) => {
  if ((chain === undefined) || (chain.length === 0)) {
    return true
  }

  if (kuroshiroLoaded) {
    word = kuroshiro.toHiragana(word)
    chain = chain.map((e) => kuroshiro.toHiragana(e))
  }

  // 漢字からひらがなにする。
  const wordHira = wanakana.toHiragana(word)
  const chainHira = chain.map(wanakana.toHiragana)

  // 使った名詞をチェックする。
  if (chainHira.indexOf(wordHira, 0) !== -1) {
    return false
  }

  // しりとりの最初の文字をチェックする。
  const validKanas = exports.kanas(chain[0])
  for (const k of validKanas) {
    const begin = wordHira.slice(0, k.length)
    if (begin === k) {
      return true
    }
  }
  return false
}

// 名詞からしりとりのひらがなを選ぶ。
exports.kanas = (word) => new Set((() => {
  if (kuroshiroLoaded) {
    word = kuroshiro.toHiragana(word)
  }

  const wordKana = wanakana.toKatakana(word)
  const wordHira = wanakana.toHiragana(wordKana)
  const kk = wordKana[word.length - 1]
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
})())

// しりとりのゲームループ。
exports.interact = (dict, word, chain) => new Promise((resolve, reject) => {
  const next = exports.kanas(word)
  if ((next.size === 0) || !exports.check(word, chain)) {
    return reject({loose: true})
  }
  const key = next.values().next().value
  dict(key).then((words) => {
    const unused = []
    if (words) {
      for (const k of Object.keys(words)) {
        if (!chain.includes(words[k])) {
          unused.push(k)
        }
      }
    }
    if (unused.length === 0) {
      return reject({win: true})
    }
    const w = unused[Math.floor(Math.random() * unused.length)]
    const wk = words[w]
    if (wk.length === 0) {
      return reject({error: 'empty dictionary entry for key: ' + w})
    }
    if (wk[wk.length - 1] === 'ん') {
      return reject({win: true, word: w, kana: wk})
    }
    resolve({word: w, kana: wk})
  })
})
