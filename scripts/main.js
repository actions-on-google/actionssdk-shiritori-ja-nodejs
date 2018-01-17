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

const {shiritori} = require('../functions/index');
const process = require('process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const app = {
  data: {},
  input: '',
  getRawInput () {
    return app.input;
  },
  ask (s) {
    console.log(s.displayText || s);
    rl.prompt();
  },
  tell (s) {
    console.log(s);
    process.exit();
  }
};

shiritori.actionMap.get('input.welcome')(app);
rl.on('line', function (input) {
  app.input = input;
  shiritori.actionMap.get('input.unknown')(app);
});
