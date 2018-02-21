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

const fs = require('fs');
const wanakana = require('wanakana');
const kuroshiro = require('kuroshiro');
const path = require('path');

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

function parseEdict2 (line, hiragana) {
  const jp = line.substr(0, line.indexOf(' /'));
  const parts = jp.split(' ');
  function first (part) {
    var words = part.split(';');
    var w = words[0];
    var i = w.indexOf('(');
    if (i > 0) {
      return w.substr(0, i);
    }
    return w;
  }
  var result = {};
  result.漢字 = first(parts[0]);
  if (parts.length > 1) {
    result.かな = first(parts[1].substr(1, parts[1].length - 2));
  }
  return result;
}

fs.readFile(process.argv[3], 'utf8', function (err, data) {
  if (err) {
    console.log(err);
    return;
  }
  kuroshiro.init(function (err) {
    if (err) {
      console.log(err);
      return;
    }
    const しりとり = {};
    data.split('\n').forEach(function (line) {
      if (line.length === 0) {
        return;
      }
      const parsed = parseEdict2(line);
      const word = parsed.漢字;
      const kana = wanakana.toHiragana(kuroshiro.toHiragana(word));
      const k = kana[0];
      const lk = kana[kana.length - 1];
      if ((lk === 'ん') || !wanakana.isHiragana(k) || !wanakana.isHiragana(lk)) {
        // skipping:  田舎パン いなかパン い パ
        console.warn('skipping: ', word, kana, k, lk);
        return;
      }
      if (admin) {
        const db = admin.database();
        const ref = db.ref(process.argv[2]);
        ref.child(k).child(word).set(kana);
      }
      if (しりとり[k] === undefined) {
        しりとり[k] = {};
      }
      しりとり[k][word] = kana;
    });
    console.log(JSON.stringify(しりとり));
    if (admin) {
      admin.database().goOffline();
    }
  });
});
