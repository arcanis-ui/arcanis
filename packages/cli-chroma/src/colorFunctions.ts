/**
 * Copyright (c) DragonSpark 2024
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this repository.
 *
 * May your code be mighty and your dragons ever fierce.
 */

import { assembleColor } from './colorGenerator.ts';

export const colorFunctions = {
  reset: assembleColor(0, 0),
  bold: assembleColor(1, 22, '\x1b[22m\x1b[1m'),
  dim: assembleColor(2, 22, '\x1b[22m\x1b[2m'),
  italic: assembleColor(3, 23),
  underline: assembleColor(4, 24),
  inverse: assembleColor(7, 27),
  hidden: assembleColor(8, 28),
  strikethrough: assembleColor(9, 29),
  black: assembleColor(30, 39),
  red: assembleColor(31, 39),
  green: assembleColor(32, 39),
  yellow: assembleColor(33, 39),
  blue: assembleColor(34, 39),
  magenta: assembleColor(35, 39),
  cyan: assembleColor(36, 39),
  white: assembleColor(37, 39),
  gray: assembleColor(90, 39),
  bgBlack: assembleColor(40, 49),
  bgRed: assembleColor(41, 49),
  bgGreen: assembleColor(42, 49),
  bgYellow: assembleColor(43, 49),
  bgBlue: assembleColor(44, 49),
  bgMagenta: assembleColor(45, 49),
  bgCyan: assembleColor(46, 49),
  bgWhite: assembleColor(47, 49),
  blackBright: assembleColor(90, 39),
  redBright: assembleColor(91, 39),
  greenBright: assembleColor(92, 39),
  yellowBright: assembleColor(93, 39),
  blueBright: assembleColor(94, 39),
  magentaBright: assembleColor(95, 39),
  cyanBright: assembleColor(96, 39),
  whiteBright: assembleColor(97, 39),
  bgBlackBright: assembleColor(100, 49),
  bgRedBright: assembleColor(101, 49),
  bgGreenBright: assembleColor(102, 49),
  bgYellowBright: assembleColor(103, 49),
  bgBlueBright: assembleColor(104, 49),
  bgMagentaBright: assembleColor(105, 49),
  bgCyanBright: assembleColor(106, 49),
  bgWhiteBright: assembleColor(107, 49)
};
