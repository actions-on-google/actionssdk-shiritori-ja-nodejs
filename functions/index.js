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

const { DialogflowApp } = require('actions-on-google');
const functions = require('firebase-functions');
const shiritori = require('./shiritori');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

const dict = k => {
  return admin.database()
      .ref('food').child(k)
      .once('value')
      .then(snap => snap.val());
};

function welcomeHandler (app) {
  app.ask('どうぞ、始めて下さい');
}

function gameHandler (app) {
  shiritori.loaded.then(() => {
    const input = app.getRawInput();
    shiritori.interact(dict, input, app.data.used, {
      lose () {
        app.tell('ざんねん。あなたの負けです。');
      },
      win (word, kana) {
        if (word) {
          app.tell(`${word} [${kana}]`);
        } else {
          app.tell('すごい！あなたの勝ちです。');
        }
      },
      next (word, kana) {
        app.data.used.unshift(input);
        app.data.used.unshift(word);
        app.ask({
          speech: word,
          displayText: `${word} [${kana}]`
        });
      }
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
  app.data.used = app.data.used || [];
  console.log('Request headers: ' + JSON.stringify(request.headers));
  console.log('Request body: ' + JSON.stringify(request.body));
  app.handleRequest(actionMap);
});
exports.shiritori.actionMap = actionMap;
