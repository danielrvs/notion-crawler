// Polyfill TextEncoder/TextDecoder for jsdom in Node < 19
import { TextEncoder, TextDecoder } from 'util';
// @ts-ignore
if (typeof global.TextEncoder === 'undefined') {
  // @ts-ignore
  global.TextEncoder = TextEncoder as any;
}
// @ts-ignore
if (typeof global.TextDecoder === 'undefined') {
  // @ts-ignore
  global.TextDecoder = TextDecoder as any;
}