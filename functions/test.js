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

import test from 'ava'
import functions from '.'
import sinon from 'sinon'
import admin from 'firebase-admin'

const corpus = require('./corpus.json')

test.before(t => {
  sinon.stub(Math, 'random').returns(0)
})

test.serial('welcome', async t => {
  const req = fakeReq({'inputs': [
    {
      'intent': 'actions.intent.MAIN'
    }
  ]})
  const res = fakeRes()
  functions.shiritoriV3(req, res)
  const result = await res.called
  t.snapshot(result)
})

test.serial('game: next', async t => {
  const req = fakeReq({'inputs': [
    {
      'intent': 'actions.intent.TEXT',
      'rawInputs': [
        {
          'inputType': 'VOICE',
          'query': 'とんかつ'
        }
      ]
    }
  ]})
  const res = fakeRes()
  sinon.stub(admin, 'database').get(() => () => fakeDb(corpus))
  functions.shiritoriV3(req, res)
  const result = await res.called
  t.snapshot(result)
})

test.serial('game: loose', async t => {
  const req = fakeReq({'inputs': [
    {
      'intent': 'actions.intent.TEXT',
      'rawInputs': [
        {
          'inputType': 'VOICE',
          'query': '座布団'
        }
      ]
    }
  ]})
  const res = fakeRes()
  sinon.stub(admin, 'database').get(() => () => fakeDb(corpus))
  functions.shiritoriV3(req, res)
  const result = await res.called
  t.snapshot(result)
})

test.serial('game: win', async t => {
  const req = fakeReq({'inputs': [
    {
      'intent': 'actions.intent.TEXT',
      'rawInputs': [
        {
          'inputType': 'VOICE',
          'query': 'とんかつ'
        }
      ]
    }
  ]})
  const res = fakeRes()
  sinon.stub(admin, 'database').get(() => () => fakeDb({'つ':[]}))
  functions.shiritoriV3(req, res)
  const result = await res.called
  t.snapshot(result)
})

function fakeReq(body) {
  return {
    get: () => {},
    body: body,
    headers: {}
  }
}

function fakeRes(callback) {
  const fake = {
    status: () => fake,
    setHeader: () => fake
  }
  fake.called = new Promise((resolve, reject) => {
    fake.send = resolve
  })
  return fake
}

function fakeDb(data) {
  const fake = {
    ref: () => fake,
    child: k => {
      return {
        once: () => new Promise((resolve, reject) => {
          resolve({val: () => data[k]})
        })
      }
    }
  }
  return fake
}
