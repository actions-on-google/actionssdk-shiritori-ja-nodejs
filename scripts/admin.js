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

'use strict';

const fs = require('fs/promises');
const wanakana = require('wanakana');
const Kuroshiro = require('kuroshiro');
const KuromojiAnalyzer = require('kuroshiro-analyzer-kuromoji');
const kuroshiro = new Kuroshiro();

if (process.argv.length < 4) {
  console.error('usage: admin <category> <edict> [service-action.json]');
  process.exit(-1);
}

let admin;
if (process.argv.length === 5) {
  admin = require('firebase-admin');
  const serviceAccount = require(process.argv[4]);
  const projectId = serviceAccount['project_id'];
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://' + projectId + '.firebaseio.com'
  });
}

async function * parseEdict2 (path) {
  const data = await fs.readFile(path, 'utf8');
  const lines = data.split('\n');
  for (const line of lines) {
    if (line.length === 0) {
      continue;
    }
    const jp = line.substr(0, line.indexOf(' /'));
    const parts = jp.split(' ');
    const words = parts[0].split(';');
    const w = words[0];
    const i = w.indexOf('(');
    const first = i > 0 ? w.substr(0, i) : w;
    yield first;
  }
}

(async function () {
  await kuroshiro.init(new KuromojiAnalyzer());
  const しりとり = {};
  for await (const 漢字 of parseEdict2(process.argv[3])) {
    // https://github.com/hexenq/kuroshiro/issues/64
    const かな = wanakana.toHiragana(await kuroshiro.convert(漢字, { to: 'hiragana' }));
    const k = かな[0];
    const lk = かな[かな.length - 1];
    if (lk === 'ん') {
      console.warn('skipping:', 漢字, 'ん[-1]:', lk);
      continue;
    }
    if (!wanakana.isHiragana(k)) {
      console.warn('skipping:', 漢字, '!ひらがな[0]:', k);
      continue;
    }
    if (!wanakana.isHiragana(lk)) {
      console.warn('skipping:', 漢字, '!ひらがな[-1]:', lk);
      continue;
    }
    if (admin) {
      const db = admin.database();
      const ref = db.ref(process.argv[2]);
      ref.child(k).child(漢字).set(かな);
    }
    if (しりとり[k] === undefined) {
      しりとり[k] = {};
    }
    しりとり[k][漢字] = かな;
  }
  console.log(JSON.stringify(しりとり));
})();
