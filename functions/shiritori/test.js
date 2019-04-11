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
import shiritori from '.'

test('check: shiritori', async t => {
  t.true(await shiritori.check('とんかつ', ['べんと']))
})

test('check: ends with ん', async t => {
  await t.throwsAsync(shiritori.check('とん', ['べんと']),
                      /ん/)
  await t.throwsAsync(shiritori.check('トン', ['べんと']),
                      /ん/)
})

test('check: already used', async t => {
  await t.throwsAsync(shiritori.check('とんかつ', ['べんと', 'トンカツ']),
                      /already used/)
})

test('check: not shiritori', async t => {
  await t.throwsAsync(shiritori.check('とんかつ', ['エビフライ']),
                      /does not match/)
})

test('check: ー rules', async t => {
  t.true(await shiritori.check('アイスクリーム', ['ミキサー']))
  t.true(await shiritori.check('サンドバッグ', ['ミキサー']))
  t.true(await shiritori.check('サーキット', ['ミキサー']))
  t.true(await shiritori.check('かり', ['りかー']))
  t.true(await shiritori.check('あり', ['りかー']))
  t.true(await shiritori.check('田んぼ', ['スプリンター']))
  await t.throwsAsync(shiritori.check('とんかつ', ['りかー']),
                      /does not match/)
})

test('check: ぁぃぅぇぉゃゅょ rules', async t => {
  t.true(await shiritori.check('やり', ['かっしゃ']))
  t.true(await shiritori.check('しゃくなげ', ['かっしゃ']))
})

test('check: kanji', async t => {
  t.true(await shiritori.check('六本木', ['白']))
})

test('kanas', async t => {
  t.deepEqual(new Set([]), await shiritori.kanas('らめん'))
  t.deepEqual(new Set(['つ']), await shiritori.kanas('とんかつ'))
  t.deepEqual(new Set(['あ', 'さ']), await shiritori.kanas('ミキサー'))
  t.deepEqual(new Set(['や', 'しゃ']), await shiritori.kanas('かっしゃ'))
  t.deepEqual(new Set(['あ']), await shiritori.kanas('リアー'))
  t.deepEqual(new Set(['あ', 'か']), await shiritori.kanas('りかー'))
  t.deepEqual(new Set(['ざ']), await shiritori.kanas('銀座'))
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

test('interact: next', async t => {
  const result = await shiritori.interact(dict, 'べんと', [])
  t.is('とんかつ', result.kana)
  t.is('とんかつ', result.word)
})

test('interact: lose', async t => {
  await t.throwsAsync(shiritori.interact(dict, 'つと', ['とつ', 'つと']),
                      {instanceOf: shiritori.Bad,
                       message: /already used/})
})

test('interact: win without result', async t => {
  await t.throwsAsync(shiritori.interact(dict, 'つと', ['とんかつ', 'べんと']),
                      {instanceOf: shiritori.Win})
})

test('interact: win with result', async t => {
  await t.throwsAsync(shiritori.interact(dict, 'とんかつ', ['べんと']),
                      {instanceOf: shiritori.Win})
})

test('interact: win with ん', async t => {
  await t.throwsAsync(shiritori.interact(dict, '銀座', ['鰻']),
                      {instanceOf: shiritori.Win})
})

test('interact: error ', async t => {
  await t.throwsAsync(shiritori.interact(k => Promise.resolve({ 'つけまん': '' }),
                                         'とんかつ', ['べんと']),
                      {instanceOf: Error,
                       message:/no dictionary entry/})
})
