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

const { DialogflowApp } = require('actions-on-google');
const functions = require('firebase-functions');
const しりとり = (function () {
  try {
    const admin = require('firebase-admin');
    admin.initializeApp(functions.config().firebase);
    return (kana, cb) => {
      admin.database().ref('food').child(kana).once('value', (snapshot) => {
        cb(snapshot.val());
      });
    };
  } catch (e) {
    console.log('firebase initialization failed:');
    console.log(e.message);
    console.log('falling back on local corpus');
    const corpus = require('./corpus.json');
    return (kana, cb) => {
      cb(corpus[kana]);
    };
  }
}());
const kuroshiro = require('kuroshiro');
const wanakana = require('wanakana');
const path = require('path');
const dicPath = path.join(path.dirname(path.dirname(require.resolve('kuromoji'))), 'dict');
const kuroshiroLoaded = new Promise((resolve, reject) => {
  kuroshiro.init({dicPath: dicPath}, function (err) {
    if (err) {
      reject(err);
      return;
    }
    resolve();
  });
});

function welcomeHandler (app) {
  app.data.used = ['しりとり'];
  app.ask('しりとり');
}

function gameHandler (app) {
  kuroshiroLoaded.then(() => {
    const input = app.getRawInput();
    const kana = wanakana.toHiragana(kuroshiro.toHiragana(input));
    let k = kana[kana.length - 1];
    if ((k === 'ー') && (kana.length > 1)) {
      k = kana[kana.length - 2];
    }
    const pkana = app.data.used[0];
    let pk = pkana[pkana.length - 1];
    if ((pk === 'ー') && (pkana.length > 1)) {
      pk = pkana[pkana.length - 2];
    }
    if ((k === 'ー') || (k === 'ん') || (kana[0] !== pk) || app.data.used.includes(kana)) {
      app.tell('ざんねん。');
      return;
    }
    app.data.used.unshift(kana);
    しりとり(k, (words) => {
      const unused = [];
      if (words) {
        const keys = Object.keys(words);
        keys.forEach(function (k) {
          if (!app.data.used.includes(words[k])) {
            unused.push(k);
          }
        });
      }
      if (unused.length === 0) {
        app.tell('すごい！');
        return;
      }
      const w = unused[Math.floor(Math.random() * unused.length)];
      const wkana = words[w];
      if (wkana[wkana.length - 1] === 'ん') {
        app.tell(w);
        return;
      }
      app.data.used.unshift(wkana);
      app.ask({
        speech: w,
        displayText: `${w} [${wkana}]`
      });
    });
  });
}

function defaultHandler (app) {
  app.tell('しりとりのゲーム');
}

const actionMap = new Map();
actionMap.set('input.welcome', welcomeHandler);
actionMap.set('input.unknown', gameHandler);
actionMap.set('default', defaultHandler);

exports.shiritori = functions.https.onRequest((request, response) => {
  const app = new DialogflowApp({request, response});
  console.log('Request headers: ' + JSON.stringify(request.headers));
  console.log('Request body: ' + JSON.stringify(request.body));
  app.handleRequest(actionMap);
});
exports.shiritori.actionMap = actionMap;
