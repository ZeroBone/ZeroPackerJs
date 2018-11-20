/*
 * Copyright (c) 2018 Alexander Mayorov (zerobone.ru, vk.com/alxmay) All rights reserved.
 */

"use strict";

const ZeroBuffer = require("../ZeroBuffer");

const str1 = "heLlo소소소!";
const str2 = "hello!";

console.time("test");

const buffer = ZeroBuffer.create(60);

buffer.safe(true);

buffer.writeUByte(1);

/*buffer.writeUByte(2);

buffer.writeUByte(3);

buffer.writeUIntBE(4294967295);

buffer.writeDoubleBE(Math.PI);
buffer.writeFloatBE(Math.PI);

buffer.writeUIntBE(4294967295);*/

buffer.writeVString(ZeroBuffer.constants.ENCODING_UTF8, str1);
buffer.writeVString(ZeroBuffer.constants.ENCODING_UTF8, str2);

// buffer.writeUVarInt(4294967295 / 2 - 1);

// buffer.writeVarIntBE(64);

/*for (let i = 0; i < 1000; i++) {

    buffer.writeUIntBE(4294967295);

    buffer.writeFloatBE(Math.random());

}*/

// buffer.writeString(ZeroBuffer.constants.ENCODING_UTF8, "привеТиКи кукушАК");

// buffer.writeUByte(255);

console.log(buffer.getBuffer());

console.timeEnd("test");

const rb = ZeroBuffer.fromByteArray(buffer.getByteArray());

console.log("1: " + rb.readUByte());

/*console.log("2: " + rb.readUByte());
console.log("3: " + rb.readUByte());
console.log("4294967295: " + rb.readUIntBE());
console.log(Math.PI + ": " + rb.readDoubleBE());
console.log(Math.PI + ": " + rb.readFloatBE());

console.log("4294967295: " + rb.readUIntBE());*/

const rstr1 = rb.readVString(ZeroBuffer.constants.ENCODING_UTF8);

console.log("first str:", rstr1);

console.log(rstr1 === str1 ? "PASS": "FAIL");

const rstr2 = rb.readVString(ZeroBuffer.constants.ENCODING_UTF8);

console.log("second str:", rstr2);

console.log(rstr2 === str2 ? "PASS": "FAIL");