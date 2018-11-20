/*
 * Copyright (c) 2018 Alexander Mayorov (zerobone.ru, vk.com/alxmay) All rights reserved.
 */

"use strict";

// const assert = require("assert");

const ZeroPacker = require("../ZeroPacker");

const ZeroBuffer = require("../src/classes/ZeroBuffer");

// const user1 = require("./testdata");
// const user1 = require("./testdata2");

const val = [10000, 20000, Number.MAX_SAFE_INTEGER];

/*let schema = new ZeroPacker.Schema({
    val: ZeroPacker.Type.TYPE_BOOLEAN,
    name: {
        first: ZeroPacker.Type.TYPE_VSTRING,
        last: ZeroPacker.Type.TYPE_BSTRING
    },
    pass: ZeroPacker.Type.TYPE_ISTRING,
    idName: ZeroPacker.Type.TYPE_SSTRING,
    creationDate: ZeroPacker.Type.TYPE_DATE,
    active: ZeroPacker.Type.TYPE_BOOLEAN,
    achievements: [ZeroPacker.Type.TYPE_UINT],
    phones: [{
        countryCode: ZeroPacker.Type.TYPE_UINT,
        active: ZeroPacker.Type.TYPE_BOOLEAN,
        data: {
            num: ZeroPacker.Type.TYPE_UINT
        },
        history: [{
            used: ZeroPacker.Type.TYPE_DATE,
            balance: ZeroPacker.Type.TYPE_INT
        }],
        pi: ZeroPacker.Type.TYPE_DOUBLE
    }],
    minutes: ZeroPacker.Type.TYPE_VARUINT,
    seed: ZeroPacker.Type.TYPE_FLOAT,
    shrt: ZeroPacker.Type.TYPE_SHORT,
    ushrt: ZeroPacker.Type.TYPE_USHORT,
    byte: ZeroPacker.Type.TYPE_BYTE,
    ubyte: ZeroPacker.Type.TYPE_UBYTE,
    flt: ZeroPacker.Type.TYPE_FLOAT
});*/

const schema = new ZeroPacker.Schema([ZeroPacker.Type.TYPE_VARUINT]);

/*const stat = {
    length: ZeroPacker.Type.TYPE_UINT,
    min: ZeroPacker.Type.TYPE_UINT,
    q1: ZeroPacker.Type.TYPE_UINT,
    median: ZeroPacker.Type.TYPE_UINT,
    q3: ZeroPacker.Type.TYPE_UINT,
    max: ZeroPacker.Type.TYPE_UINT,
    total: ZeroPacker.Type.TYPE_UINT,
    avg: ZeroPacker.Type.TYPE_FLOAT
};


const schema = new ZeroPacker.Schema({
    data: [{
        date: ZeroPacker.Type.TYPE_DATE,
        stats: {
            a: stat,
            b: stat,
            c: stat,
            d: stat,
            e: stat
        }
    }]
});*/

// TESTS

const times = 1;

console.time("JSON encode");

let jsonString;

for (let i = 0; i < times; i++) {

    jsonString = JSON.stringify(val);

}

console.timeEnd("JSON encode");

console.time("JSON decode");

for (let i = 0; i < times; i++) {

    JSON.parse(jsonString);

}

console.timeEnd("JSON decode");



console.time("ZeroPacker encode");

let buffer;

for (let i = 0; i < times; i++) {

    buffer = schema.encode(val);

    buffer = buffer.getBuffer();

}

console.timeEnd("ZeroPacker encode");

console.log("Encoded:", buffer);

console.log("ZeroPacker length: " + buffer.length + " JSON length: " + jsonString.length);

const decb = ZeroBuffer.fromBuffer(buffer);

let decoded;

console.time("ZeroPacker decode");

for (let i = 0; i < times; i++) {

    decoded = schema.decode(decb);

    decb.setOffset(0);

}

console.timeEnd("ZeroPacker decode");


// console.log(decb.getByteArray().length === decb._offset ? "PASS" : "FAIL");

// console.log("Decoded:", decoded);

// console.log(JSON.stringify(user1) === JSON.stringify(decoded));
console.log(require("util").inspect(decoded, false, null));