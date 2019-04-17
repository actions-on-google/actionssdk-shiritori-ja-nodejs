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

test('check: continue', async t => {
  t.is(await shiritori.check('とんかつ', ['べんと']),
    shiritori.state.CONTINUE)
})

test('check: loose ん', async t => {
  t.is(await shiritori.check('とん', ['べんと']),
    shiritori.state.LOSE_N)
  t.is(await shiritori.check('トン', ['べんと']),
    shiritori.state.LOSE_N)
})

test('check: loose used', async t => {
  t.is(await shiritori.check('とんかつ', ['べんと', 'トンカツ']),
    shiritori.state.LOSE_USED)
})

test('check: loose chain', async t => {
  t.is(await shiritori.check('とんかつ', ['エビフライ']),
    shiritori.state.LOSE_CHAIN)
})

test('check: ー rules', async t => {
  t.is(await shiritori.check('アイスクリーム', ['ミキサー']),
    shiritori.state.CONTINUE)
  t.is(await shiritori.check('サンドバッグ', ['ミキサー']),
    shiritori.state.CONTINUE)
  t.is(await shiritori.check('サーキット', ['ミキサー']),
    shiritori.state.CONTINUE)
  t.is(await shiritori.check('かり', ['りかー']),
    shiritori.state.CONTINUE)
  t.is(await shiritori.check('あり', ['りかー']),
    shiritori.state.CONTINUE)
  t.is(await shiritori.check('田んぼ', ['スプリンター']),
    shiritori.state.CONTINUE)
  t.is(await shiritori.check('とんかつ', ['りかー']),
    shiritori.state.LOSE_CHAIN)
})

test('check: ぁぃぅぇぉゃゅょ rules', async t => {
  t.is(await shiritori.check('やり', ['かっしゃ']),
    shiritori.state.CONTINUE)
  t.is(await shiritori.check('しゃくなげ', ['かっしゃ']),
    shiritori.state.CONTINUE)
})

test('check: kanji', async t => {
  t.is(await shiritori.check('六本木', ['白']),
    shiritori.state.CONTINUE)
})

test('kanas', async t => {
  t.deepEqual(await shiritori.kanas('らめん'), new Set([]))
  t.deepEqual(await shiritori.kanas('とんかつ'), new Set(['つ']))
  t.deepEqual(await shiritori.kanas('ミキサー'), new Set(['あ', 'さ']))
  t.deepEqual(await shiritori.kanas('かっしゃ'), new Set(['や', 'しゃ']))
  t.deepEqual(await shiritori.kanas('リアー'), new Set(['あ']))
  t.deepEqual(await shiritori.kanas('りかー'), new Set(['あ', 'か']))
  t.deepEqual(await shiritori.kanas('銀座'), new Set(['ざ']))
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
  t.is(result.state, shiritori.state.CONTINUE)
  t.is(result.kana, 'とんかつ')
  t.is(result.word, 'とんかつ')
})

test('interact: lose', async t => {
  const result = await shiritori.interact(dict, 'つと', ['とつ', 'つと'])
  t.is(result.state, shiritori.state.LOSE_USED)
})

test('interact: win used', async t => {
  const result = await shiritori.interact(dict, 'つと', ['とんかつ', 'べんと'])
  t.is(result.state, shiritori.state.WIN_USED)
})

test('interact: win ん', async t => {
  const result = await shiritori.interact(dict, '銀座', ['鰻'])
  t.is(result.state, shiritori.state.WIN_N)
  t.is(result.kana[result.kana.length - 1], 'ん')
})

test('interact: empty dict', async t => {
  const result = await shiritori.interact(k => Promise.resolve(null),
                                          'とんかつ', ['べんと'])
  t.is(result.state, shiritori.state.WIN_USED)
})
