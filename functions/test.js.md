# Snapshot report for `test.js`

The actual snapshot is saved in `test.js.snap`.

Generated by [AVA](https://ava.li).

## game: lose

> Snapshot 1

    {
      expectUserResponse: false,
      finalResponse: {
        richResponse: RichResponse {
          items: [
            {
              simpleResponse: SimpleResponse {
                textToSpeech: 'ざんねん。あなたの負けです。',
              },
            },
          ],
        },
      },
    }

## game: next

> Snapshot 1

    {
      conversationToken: '{"data":{"used":["つかみ所","とんかつ"]}}',
      expectUserResponse: true,
      expectedInputs: [
        {
          inputPrompt: {
            noInputPrompts: undefined,
            richInitialPrompt: RichResponse {
              items: [
                {
                  simpleResponse: SimpleResponse {
                    displayText: 'つかみ所 [つかみしょ]',
                    textToSpeech: 'つかみ所',
                  },
                },
              ],
            },
          },
          possibleIntents: [
            {
              intent: 'actions.intent.TEXT',
            },
          ],
          speechBiasingHints: undefined,
        },
      ],
    }

## game: win

> Snapshot 1

    {
      expectUserResponse: false,
      finalResponse: {
        richResponse: RichResponse {
          items: [
            {
              simpleResponse: SimpleResponse {
                textToSpeech: 'すごい！あなたの勝ちです。',
              },
            },
          ],
        },
      },
    }

## welcome

> Snapshot 1

    {
      expectUserResponse: true,
      expectedInputs: [
        {
          inputPrompt: {
            noInputPrompts: undefined,
            richInitialPrompt: RichResponse {
              items: [
                {
                  simpleResponse: SimpleResponse {
                    textToSpeech: 'どうぞ、始めて下さい',
                  },
                },
              ],
            },
          },
          possibleIntents: [
            {
              intent: 'actions.intent.TEXT',
            },
          ],
          speechBiasingHints: undefined,
        },
      ],
    }
