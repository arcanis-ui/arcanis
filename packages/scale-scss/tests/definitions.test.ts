/**
 * Copyright (c) DragonSpark 2024
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this repository.
 *
 * May your code be mighty and your dragons ever fierce.
 */

import { suite, describe, expect, test, beforeAll } from 'vitest';
import { generate, types as t } from '../src';
import { PRETTIER_OPTIONS } from '../src/generator/printer';
import { format } from 'prettier';
import { ASTNode } from '../src/ast';

beforeAll(async () => {
  const { Console } = await import('node:console');
  globalThis.console = new Console(process.stdout, process.stderr);
});

suite('definitions', () => {
  describe('comments', () => {
    test('empty', async () => {
      const template = t.StyleSheet({
        children: [t.Comment({ value: '' })]
      });

      const code = await generate(template);
      expect(code).toEqual(await format('', PRETTIER_OPTIONS));
    });

    test('single line', async () => {
      const template = t.StyleSheet({
        children: [t.Comment({ value: 'This is a comment!' })]
      });

      const code = await generate(template);
      expect(code).toEqual(
        await format('// This is a comment!', PRETTIER_OPTIONS)
      );
    });

    test('multi line', async () => {
      const template = t.StyleSheet({
        children: [
          t.Comment({
            value: 'This is a comment!\nAnd it has an additional line!'
          })
        ]
      });

      const code = await generate(template);
      expect(code).toEqual(
        await format(
          '// This is a comment!\n// And it has an additional line!',
          PRETTIER_OPTIONS
        )
      );
    });
  });

  describe('assignments', () => {
    const assignment = [
      ['boolean', t.SassBoolean({ value: true }), '$variable: true;'],
      [
        'list',
        t.SassList({
          elements: [
            t.SassNumber({ value: 1 }),
            t.SassNumber({ value: 2 }),
            t.SassNumber({ value: 3 })
          ]
        }),
        '$variable: (1, 2, 3);'
      ],
      [
        'map',
        t.SassMap({
          properties: [
            t.SassMapProperty({
              key: t.Identifier({ name: 'a' }),
              value: t.SassNumber({ value: 1 })
            }),
            t.SassMapProperty({
              key: t.Identifier({ name: 'b' }),
              value: t.SassNumber({ value: 2 }),
              quoted: true
            }),
            t.SassMapProperty({
              key: t.Identifier({ name: 'c' }),
              value: t.SassNumber({ value: 3 })
            })
          ]
        }),
        `$variable: (
                  a: 1,
                  'b': 2,
                  c: 3
                );`
      ],
      ['number', t.SassNumber({ value: 1 }), '$variable: 1;'],
      ['string', t.SassString({ value: 'string' }), `$variable: 'string';`],
      [
        'flags',
        t.SassString({ value: 'string' }),
        `$variable: 'string' !default !global;`,
        {
          default: true,
          global: true
        }
      ]
    ];

    test.each(assignment)('%s', async (_, init, expected: string, options) => {
      const optionSpread = typeof options === 'object' ? { ...options } : {};

      const template = t.StyleSheet({
        children: [
          t.Assignment({
            id: t.Identifier({ name: 'variable' }),
            init,
            ...optionSpread
          })
        ]
      });

      const code = await generate(template);
      expect(code).toEqual(await format(expected.trim(), PRETTIER_OPTIONS));
    });
  });

  describe('rules', () => {
    const rules = [
      [
        'selector',

        t.Rule({
          selectors: ['ul'],
          declarations: [
            t.Declaration({
              property: 'display',
              value: 'block'
            })
          ]
        }),
        `ul {
                  display: block;
                }`
      ],
      [
        'multiple declarations',
        t.Rule({
          selectors: ['ul'],
          declarations: [
            t.Declaration({
              property: 'display',
              value: 'block'
            }),
            t.Declaration({
              property: 'position',
              value: 'absolute'
            })
          ]
        }),
        `ul {
                  display: block;
                  position: absolute;
                }`
      ],
      [
        'selectors',
        t.Rule({
          selectors: ['.selector-a', '.selector-b'],
          declarations: [
            t.Declaration({
              property: 'display',
              value: 'block'
            })
          ]
        }),
        `.selector-a, .selector-b {
                  display: block;
                }`
      ]
    ];

    test.each(rules)('%s', async (_, rule, expected: string) => {
      const code = await generate(
        t.StyleSheet({
          children: [rule]
        })
      );
      expect(code).toEqual(await format(expected.trim(), PRETTIER_OPTIONS));
    });
  });

  describe('function', () => {
    const functions = [
      [
        'no arguments, no body',
        t.SassFunction({
          id: t.Identifier({ name: 'test' }),
          body: t.BlockStatement({
            body: []
          })
        }),
        `@function test() {
                }`
      ],
      [
        'no arguments',
        t.SassFunction({
          id: t.Identifier({ name: 'test' }),
          body: t.BlockStatement({
            body: [t.AtReturn({ argument: t.SassValue({ value: '$x' }) })]
          })
        }),
        `@function test() {
                  @return $x;
                }`
      ],
      [
        'argument',
        t.SassFunction({
          id: t.Identifier({ name: 'test' }),
          params: [t.Identifier({ name: 'a' })],
          body: t.BlockStatement({
            body: [t.AtReturn({ argument: t.SassNumber({ value: 1 }) })]
          })
        }),
        `@function test($a) {
                  @return 1;
                }`
      ],
      [
        'arguments',
        t.SassFunction({
          id: t.Identifier({ name: 'test' }),
          params: [
            t.Identifier({ name: 'a' }),
            t.Identifier({ name: 'b' }),
            t.Identifier({ name: 'c' })
          ],
          body: t.BlockStatement({
            body: [
              t.Declaration({
                property: '$x',
                value: '1'
              }),
              t.Declaration({
                property: '$y',
                value: t.SassColor({ value: '#000' })
              }),
              t.AtReturn({ argument: t.SassColor({ value: '#FFF' }) })
            ]
          })
        }),
        `@function test($a, $b, $c) {
				  $x: 1;
				  $y: #000;

                  @return #fff;
                }`
      ],
      [
        'default argument',
        t.SassFunction({
          id: t.Identifier({ name: 'test' }),
          params: [
            t.AssignmentPattern({
              left: t.Identifier({ name: 'a' }),
              right: t.SassNumber({ value: 1 })
            }),
            t.Identifier({ name: 'b' }),
            t.Identifier({ name: 'c' })
          ],
          body: t.BlockStatement({
            body: [t.AtReturn({ argument: t.SassNumber({ value: 1 }) })]
          })
        }),
        `@function test($a: 1, $b, $c) {
                  @return 1;
                }`
      ],
      [
        'rest argument',
        t.SassFunction({
          id: t.Identifier({ name: 'test' }),
          params: [
            t.AssignmentPattern({
              left: t.Identifier({ name: 'a' }),
              right: t.SassNumber({ value: 1 })
            }),
            t.Identifier({ name: 'b' }),
            t.RestPattern({
              id: t.Identifier({ name: 'c' })
            })
          ],
          body: t.BlockStatement({
            body: [t.AtReturn({ argument: t.SassNumber({ value: 1 }) })]
          })
        }),
        `@function test($a: 1, $b, $c...) {
                  @return 1;
                }`
      ]
    ];

    test.each(functions)('%s', async (_, ast, expected: string) => {
      const code = await generate(
        t.StyleSheet({
          children: [ast]
        })
      );
      expect(code).toEqual(await format(expected.trim(), PRETTIER_OPTIONS));
    });
  });

  describe('mixin', () => {
    const mixins = [
      [
        'no arguments, no body',
        t.SassMixin({
          id: t.Identifier({ name: 'test' }),
          body: t.BlockStatement({
            body: []
          })
        }),
        `@mixin test() {
                }`
      ],
      [
        'no arguments',
        t.SassMixin({
          id: t.Identifier({ name: 'test' }),
          body: t.BlockStatement({
            body: [t.AtContent()]
          })
        }),
        `@mixin test() {
                  @content;
                }`
      ],
      [
        'argument',
        t.SassMixin({
          id: t.Identifier({ name: 'test' }),
          params: [t.Identifier({ name: 'a' })],
          body: t.BlockStatement({
            body: [t.AtContent()]
          })
        }),
        `@mixin test($a) {
                  @content;
                }`
      ],
      [
        'arguments',
        t.SassMixin({
          id: t.Identifier({ name: 'test' }),
          params: [
            t.Identifier({ name: 'a' }),
            t.Identifier({ name: 'b' }),
            t.Identifier({ name: 'c' })
          ],
          body: t.BlockStatement({
            body: [t.AtContent()]
          })
        }),
        `@mixin test($a, $b, $c) {
                  @content;
                }`
      ],
      [
        'default argument',
        t.SassMixin({
          id: t.Identifier({ name: 'test' }),
          params: [
            t.AssignmentPattern({
              left: t.Identifier({ name: 'a' }),
              right: t.SassNumber({ value: 1 })
            }),
            t.Identifier({ name: 'b' }),
            t.Identifier({ name: 'c' })
          ],
          body: t.BlockStatement({
            body: [t.AtContent()]
          })
        }),
        `@mixin test($a: 1, $b, $c) {
                  @content;
                }`
      ],
      [
        'rest argument',
        t.SassMixin({
          id: t.Identifier({ name: 'test' }),
          params: [
            t.AssignmentPattern({
              left: t.Identifier({ name: 'a' }),
              right: t.SassNumber({ value: 1 })
            }),
            t.Identifier({ name: 'b' }),
            t.RestPattern({
              id: t.Identifier({ name: 'c' })
            })
          ],
          body: t.BlockStatement({
            body: [t.AtContent()]
          })
        }),
        `@mixin test($a: 1, $b, $c...) {
                  @content;
                }`
      ]
    ];

    test.each(mixins)('%s', async (_, ast, expected: string) => {
      const code = await generate(
        t.StyleSheet({
          children: [ast]
        })
      );
      expect(code).toEqual(await format(expected.trim(), PRETTIER_OPTIONS));
    });
  });

  describe('calls', () => {
    const calls = [
      [
        'mixin',
        t.SassMixinCall({
          id: t.Identifier({ name: 'some-mixin' })
        }),
        '@include some-mixin();'
      ],
      [
        'mixin with args',
        t.SassMixinCall({
          id: t.Identifier({ name: 'some-mixin' }),
          params: [
            t.Identifier({ name: 'a' }),
            t.Identifier({ name: 'b' }),
            t.Identifier({ name: 'c' })
          ]
        }),
        '@include some-mixin($a, $b, $c);'
      ],
      [
        'mixin with body',
        t.SassMixinCall({
          id: t.Identifier({ name: 'some-mixin' }),
          params: [
            t.Identifier({ name: 'a' }),
            t.Identifier({ name: 'b' }),
            t.Identifier({ name: 'c' })
          ],
          body: t.BlockStatement({
            body: [
              t.Assignment({
                id: t.Identifier({ name: 'test' }),
                init: t.SassNumber({ value: 1 })
              })
            ]
          })
        }),
        `@include some-mixin($a, $b, $c) {
                  $test: 1;
                };`
      ],
      [
        'function in assignment',
        t.Assignment(
          t.Identifier('value'),
          t.SassFunctionCall(t.Identifier('map-get'), [
            t.Identifier('map'),
            t.SassString('key')
          ])
        ),
        `$value: map-get($map, 'key');`
      ]
    ];

    test.each(calls)('%s', async (_, ast, expected: string) => {
      const code = await generate(
        t.StyleSheet({
          children: [ast]
        })
      );
      expect(code).toEqual(await format(expected.trim(), PRETTIER_OPTIONS));
    });
  });

  test('logical expressions', async () => {
    const code = await generate(
      t.StyleSheet({
        children: [
          t.LogicalExpression({
            left: t.LogicalExpression({
              left: t.Identifier({ name: 'x' }),
              operator: ':',
              right: t.SassNumber({ value: 1 })
            }),
            operator: '&&',
            right: t.LogicalExpression({
              left: t.Identifier({ name: 'x' }),
              operator: '>',
              right: t.Identifier({ name: 'y' })
            })
          }),
          t.Newline(),
          t.LogicalExpression({
            left: t.LogicalExpression({
              left: t.Identifier({ name: 'x' }),
              operator: '<',
              right: t.Identifier({ name: 'z' })
            }),
            operator: '||',
            right: t.LogicalExpression({
              left: t.Identifier({ name: 'x' }),
              operator: '>=',
              right: t.Identifier({ name: 'y' })
            })
          })
        ]
      })
    );

    expect(code).toEqual(`$x: 1 && $x > $y $x < $z || $x >= $y;\n`);
  });

  describe('imports', () => {
    const path = '../arcanis/dragon';

    const calls = [
      ['import', t.SassImport({ path }), `@import '${path}'`],
      ['module', t.SassModule({ path }), `@use '${path}'`],
      ['forward', t.SassForward({ path }), `@forward '${path}'`]
    ];

    test.each(calls)('%s', async (_, ast, expected: string) => {
      const code = await generate(
        t.StyleSheet({
          children: [ast]
        })
      );
      expect(code).toEqual(await format(expected.trim(), PRETTIER_OPTIONS));
    });
  });

  describe('control', () => {
    const structures = [
      [
        'if statement',
        t.IfStatement({
          test: t.SassBoolean(true),
          consequent: t.BlockStatement([])
        }),
        `@if true {` + `\n}`
      ],

      [
        'if else',
        t.IfStatement({
          test: t.SassBoolean(false),
          consequent: t.BlockStatement([]),
          alternate: t.BlockStatement([])
        }),
        `@if false {` + `\n} @else {` + `\n}`
      ],

      [
        'if > else if > else',
        t.IfStatement({
          test: t.SassBoolean(false),
          consequent: t.BlockStatement([]),
          alternate: t.IfStatement({
            test: t.SassBoolean(false),
            consequent: t.BlockStatement([]),
            alternate: t.BlockStatement([])
          })
        }),
        `@if false {` + `\n} @else if false {` + `\n} @else {` + `\n}`
      ]
    ];

    test.each(structures)('%s', async (_, ast: ASTNode, expected: string) => {
      const code = await generate(ast);
      expect(code.trim()).toEqual(expected.trim());
    });
  });

  describe('at rules', () => {
    const calls = [
      [
        'generic',
        t.AtRule({ name: 'apply', media: "'bg-blue'", children: [] }),
        `@apply 'bg-blue';`
      ],
      [
        'generic with children',
        t.AtRule({
          name: 'apply',
          media: "'bg-blue'",
          children: [
            t.Rule({
              selectors: ['ul'],
              declarations: [
                t.Declaration({
                  property: 'display',
                  value: 'block'
                })
              ]
            }),
            t.Rule({
              selectors: ['li'],
              declarations: [
                t.Declaration({
                  property: 'display',
                  value: 'block'
                })
              ]
            })
          ]
        }),
        `@apply 'bg-blue' {
					ul {
					  display: block;
					}
					li {
					  display: block;
					}
				}`
      ],
      ['content', t.AtContent({}), `@content;`],
      [
        'return',
        t.AtReturn({ argument: t.Identifier({ name: '$test' }) }),
        `@return $test;`
      ]
    ];

    test.each(calls)('%s', async (_, ast, expected: string) => {
      const code = await generate(
        t.StyleSheet({
          children: [ast]
        })
      );
      expect(code).toEqual(await format(expected.trim(), PRETTIER_OPTIONS));
    });
  });

  describe('expressions', () => {
    const expressions = [
      [
        'no arguments',
        t.Assignment({
          id: t.Identifier('test'),
          init: t.CallExpression({
            callee: t.Identifier('foo')
          })
        }),
        '$test: foo();'
      ],
      [
        'single arguments',
        t.Assignment({
          id: t.Identifier('test'),
          init: t.CallExpression({
            callee: t.Identifier('foo'),
            arguments: [t.Identifier('bar')]
          })
        }),
        '$test: foo($bar);'
      ],
      [
        'multiple arguments',
        t.Assignment({
          id: t.Identifier('test'),
          init: t.CallExpression({
            callee: t.Identifier('foo'),
            arguments: [t.Identifier('bar'), t.Identifier('baz')]
          })
        }),
        '$test: foo($bar, $baz);'
      ]
    ];

    test.each(expressions)('%s', async (_, ast: ASTNode, expected: string) => {
      const code = await generate(ast);
      expect(code.trim()).toEqual(expected.trim());
    });
  });
});
