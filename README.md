# しりとり Actions on Google Sample

しりとりのゲーム.

## Setup

1. Create [Dialogflow](https://dialogflow.com/) Project.
1. Enable fullfillment using firebase functions.
1. Download `edict2` dictionary from http://www.edrdg.org/jmdict/edict_doc.html.
1. Convert the dictionary to utf-8:

        iconv -f euc-jp -t utf-8 edict2 -o edict2.utf8

1. Extract only food noons:

        cat edict2.utf8 | grep '/(n' | grep '{food}' > edict2-food.utf8

1. Load corpus in firebase realtime database.

        npm install scripts/
        node scripts/admin.js food edict2-food.utf8 /path/to/service-account

1. Deploy firebase functions.

        firebase deploy

1. Bump the `shiritori` cloud functions memory allocation to 512MB.
1. Set locale to japanese in the simulator.
1. Try the Assistant app.

        > テスト用アプリにつないで

## Test locally

1. Download `edict2` dictionary from http://www.edrdg.org/jmdict/edict_doc.html.
1. Convert the dictionary to utf-8:

        iconv -f euc-jp -t utf-8 edict2 -o edict2.utf8

1. Extract only food noons:

        cat edict2.utf8 | grep '/(n' | grep '{food}' > edict2-food.utf8

1. Generate local corpus:

        npm install scripts/
        node scripts/admin.js food edict2-food.utf8 > functions/corpus.json

1. Try locally:

		node scripts/main.js

```
しりとり
> りんご
胡麻酢 [ごます]
> すいか
カプリチョーザ [かぷりちょうざ]
> ざるそば
バインミー [ばいんみい]
> いか
カポナータ [かぽなあた]
> たんたんめん
ざんねん。
```


## Contributing

Contributions to this repository are always welcome and highly encouraged.

See [CONTRIBUTING.md](CONTRIBUTING.md) for more information on how to get started.

## License

Copyright (C) 2018 Google Inc.

Licensed to the Apache Software Foundation (ASF) under one or more contributor
license agreements.  See the NOTICE file distributed with this work for
additional information regarding copyright ownership.  The ASF licenses this
file to you under the Apache License, Version 2.0 (the "License"); you may not
use this file except in compliance with the License.  You may obtain a copy of
the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the
License for the specific language governing permissions and limitations under
the License.
