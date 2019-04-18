// Copyright 2019, Google, Inc.
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

import test from 'ava';
import { shiritoriApp } from '.';
import sinon from 'sinon';
import admin from 'firebase-admin';

const corpus = require('./shiritori/corpus.json');

test.beforeEach(t => {
  sinon.stub(Math, 'random').returns(0);
});

test.afterEach(t => {
  Math.random.restore();
  if (t.context.database !== undefined) {
    t.context.database.restore();
  }
});

test.serial('welcome', async t => {
  t.snapshot((await shiritoriApp({ 'inputs': [
    {
      'intent': 'actions.intent.MAIN'
    }
  ] }, {})).body);
});

test.serial('game: next', async t => {
  t.context.database = sinon.stub(admin, 'database').get(
    () => () => fakeDb(corpus)
  );
  t.snapshot((await shiritoriApp({ 'inputs': [
    {
      'intent': 'actions.intent.TEXT',
      'rawInputs': [
        {
          'inputType': 'VOICE',
          'query': 'とんかつ'
        }
      ]
    }
  ] }, {})).body);
});

test.serial('game: lose', async t => {
  t.context.database = sinon.stub(admin, 'database').get(
    () => () => fakeDb(corpus)
  );
  t.snapshot((await shiritoriApp({ 'inputs': [
    {
      'intent': 'actions.intent.TEXT',
      'rawInputs': [
        {
          'inputType': 'VOICE',
          'query': '座布団'
        }
      ]
    }
  ] }, {})).body);
});

test.serial('game: win', async t => {
  t.context.database = sinon.stub(admin, 'database').get(
    () => () => fakeDb({ 'つ': [] })
  );
  t.snapshot((await shiritoriApp({ 'inputs': [
    {
      'intent': 'actions.intent.TEXT',
      'rawInputs': [
        {
          'inputType': 'VOICE',
          'query': 'とんかつ'
        }
      ]
    }
  ] }, {})).body);
});

function fakeDb (data) {
  const fake = {
    ref: () => fake,
    child: k => {
      return {
        once: () => new Promise((resolve, reject) => {
          resolve({ val: () => data[k] });
        })
      };
    }
  };
  return fake;
}
