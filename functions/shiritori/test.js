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

import test from 'ava'
import shiritori from './index'

test('shiritori', async t => {
  await shiritori.loaded
  t.true(shiritori.check('とんかつ', ['べんと']))
})

test('already used', async t => {
  await shiritori.loaded
  t.false(shiritori.check('とんかつ', ['べんと', 'トンカツ']))
})

test('not shiritori', async t => {
  await shiritori.loaded
  t.false(shiritori.check('とんかつ', ['エビフライ']))
})

test('ー rules', async t => {
  await shiritori.loaded
  t.true(shiritori.check('アイスクリーム', ['ミキサー']))
  t.true(shiritori.check('サンドバッグ', ['ミキサー']))
  t.true(shiritori.check('サーキット', ['ミキサー']))
  t.true(shiritori.check('かり', ['りかー']))
  t.true(shiritori.check('あり', ['りかー']))
  t.false(shiritori.check('とんかつ', ['りかー']))
  t.true(shiritori.check('田んぼ', ['スプリンター']))
})

test('ぁぃぅぇぉゃゅょ rules', async t => {
  await shiritori.loaded
  t.true(shiritori.check('やり', ['かっしゃ']))
  t.true(shiritori.check('しゃくなげ', ['かっしゃ']))
})

test('kanji', async t => {
  await shiritori.loaded
  t.true(shiritori.check('六本木', ['白']))
})

test('kanas', t => {
  t.deepEqual(new Set([]), shiritori.kanas('らめん'))
  t.deepEqual(new Set(['つ']), shiritori.kanas('とんかつ'))
  t.deepEqual(new Set(['あ', 'さ']), shiritori.kanas('ミキサー'))
  t.deepEqual(new Set(['や', 'しゃ']), shiritori.kanas('かっしゃ'))
  t.deepEqual(new Set(['あ']), shiritori.kanas('リアー'))
  t.deepEqual(new Set(['あ', 'か']), shiritori.kanas('りかー'))
})

const dict = k => Promise.resolve({
  'と': {
    'とんかつ': 'とんかつ'
  },
  'べ': {
    'べんと': 'べんと'
  },
  'つ': {
    'つけまん': 'つけまん'
  },
  'ざ': {
    '座布団': 'ざぶとん'
  },
  'ぼ': {
    'ボンボン': 'ぼんぼん'
  }
}[k])

test('internal.next', async t => {
  const result = await shiritori.interact(dict, 'べんと', [])
  t.is('とんかつ', result.kana)
  t.is('とんかつ', result.word)
})

test('interact.lose', async t => {
  const result = await t.throws(shiritori.interact(dict, 'つと', ['とつ', 'つと']))
  t.is(true, result.loose)
})

test('internal.win without result', async t => {
  const result = await t.throws(shiritori.interact(dict, 'つと', ['とんかつ', 'べんと']))
  t.is(true, result.win)
})

test('internal.win with result', async t => {
  const result = await t.throws(shiritori.interact(dict, 'とんかつ', ['べんと']))
  t.is(true, result.win)
  t.is('つけまん', result.kana)
  t.is('つけまん', result.word)
})

test('interact.win kanji', async t => {
  await shiritori.loaded
  const result = await t.throws(shiritori.interact(dict, '銀座', ['鰻']))
  t.is(true, result.win)
  t.is('ざぶとん', result.kana)
  t.is('座布団', result.word)
})

test('interact.error ', async t => {
  const result = await t.throws(shiritori.interact(k => Promise.resolve({'つけまん': ''}),
                                                  'とんかつ', ['べんと']))
  t.true(result.error.length > 0)
})
