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
admin.initializeApp(functions.config().firebase);

const corpus = 'noun';

const dict = k => {
  return admin.database()
      .ref(corpus).child(k)
      .once('value')
      .then(snap => snap.val());
};

const app = actionssdk({
  debug: true,
  init: () => ({
    data: {
      used: []
    }
  })
});

app.intent('actions.intent.MAIN', (conv) => {
  conv.ask('どうぞ、始めて下さい');
});

app.intent('actions.intent.TEXT', (conv, input) => new Promise((resolve, reject) => {
  shiritori.loaded.then(() => {
    shiritori.interact(dict, input, conv.data.used, {
      lose () {
        conv.close('ざんねん。あなたの負けです。');
        resolve();
      },
      win (word, kana) {
        if (word) {
          conv.close(`${word} [${kana}]`);
          resolve();
        } else {
          conv.close('すごい！あなたの勝ちです。');
          resolve();
        }
      },
      next (word, kana) {
        conv.data.used.unshift(input);
        conv.data.used.unshift(word);
        conv.ask(new SimpleResponse({
          speech: word,
          text: `${word} [${kana}]`
        }));
        resolve();
      }
    });
  });
}));

exports.shiritoriV2 = functions.https.onRequest(app);
