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

const entries = require('object.entries');
if (!Object.entries) {
  entries.shim();
}

const { actionssdk, SimpleResponse } = require('actions-on-google');
const functions = require('firebase-functions');
const shiritori = require('./shiritori');
const admin = require('firebase-admin');
admin.initializeApp();

const corpus = 'noun';

const dict = k => admin.database()
  .ref(corpus).child(k)
  .once('value')
  .then(snap => snap.val());

const app = actionssdk({
  // リクエストとレスポンスをロギングする。
  debug: true,
  // Actionのデフォルトデータを初期化する。
  init: () => ({
    data: {
      used: []
    }
  })
});

app.intent('actions.intent.MAIN', conv => {
  conv.ask('どうぞ、始めて下さい');
});

app.intent('actions.intent.TEXT', async (conv, input) => {
  const result = await shiritori.interact(dict, input, conv.data.used);
  switch (result.state) {
    case shiritori.state.CONTINUE:
      conv.data.used.unshift(input);
      conv.data.used.unshift(result.word);
      conv.ask(new SimpleResponse({
        speech: result.word,
        text: `${result.word} [${result.kana}]`
      }));
      break;
    case shiritori.state.LOSE_N:
    case shiritori.state.LOSE_USED:
    case shiritori.state.LOSE_CHAIN:
      conv.close('ざんねん。あなたの負けです。');
      break;
    case shiritori.state.WIN_N:
    case shiritori.state.WIN_USED:
      conv.close('すごい！あなたの勝ちです。');
      break;
  }
});

// for fullfillment
exports.shiritoriV3 = functions.https.onRequest(app);
// for testing
exports.shiritoriApp = app
