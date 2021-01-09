import { randomBytes } from 'crypto'
import aes from 'js-crypto-aes'
import { CID } from 'multiformats'

const enc32 = value => {
  value = +value
  const buff = new Uint8Array(4)
  buff[3] = (value >>> 24)
  buff[2] = (value >>> 16)
  buff[1] = (value >>> 8)
  buff[0] = (value & 0xff)
  return buff
}

const readUInt32LE = (buffer) => {
  const offset = buffer.byteLength - 4
  return ((buffer[offset]) |
          (buffer[offset + 1] << 8) |
          (buffer[offset + 2] << 16)) +
          (buffer[offset + 3] * 0x1000000)
}

const encode = bytes => bytes
const decode = bytes => bytes

const code = 0x300000 + 1337

const decrypt = async ({ key, value }) => {
  let bytes = value
  const iv = bytes.subarray(0, 12)
  bytes = bytes.slice(12)
  bytes = await aes.decrypt(bytes, key, {name: 'AES-GCM', iv, tagLength: 16})
  const len = readUInt32LE(bytes.subarray(0,4))
  const cid = CID.decode(bytes.subarray(4, 4 + len))
  bytes = bytes.subarray(4 + len)
  return { cid, bytes }
}
const encrypt = async ({ key, cid, bytes }) => {
  const len = enc32(cid.bytes.byteLength)
  const iv = randomBytes(12)
  const msg = Buffer.concat([ len, cid.bytes, bytes ])
  bytes = await aes.encrypt(msg, key, {name: 'AES-GCM', iv, tagLength: 16})
  const value = Buffer.concat([ iv, bytes ])
  return { value }
}

const crypto = key => {
  return { encrypt: opts => encrypt({ key, ...opts}), decrypt: opts => decrypt({ key, ...opts}) }
}

const name = 'mikeal@encrypted-block:aes-gcm'

export { encode, decode, code, name, encrypt, decrypt, crypto }
