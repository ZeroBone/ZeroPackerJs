/*
 * Copyright (c) 2018 Alexander Mayorov (zerobone.ru, vk.com/alxmay) All rights reserved.
 */

const user1 = {
    val: true,
    name: {
        first: "Александр",
        last: "Майоров"
    },
    pass: "myseCreTPasswodрусскхар!",
    idName: "zerobone",
    creationDate: new Date(1),
    active: true,
    achievements: [1, 5, Number.MAX_SAFE_INTEGER % 20, 0, 7489743927 % 50, 2, 7],
    phones: [
        {
            countryCode: 255,
            active: false,
            data: {
                num: 475475858
            },
            history: [{
                used: new Date(1111111112),
                balance: 0xffff
            }],
            pi: Math.PI
        },
        {
            countryCode: 256,
            active: true,
            data: {
                num: 475475858
            },
            history: [{
                used: new Date(1111111112),
                balance: 0xffff + 1
            }],
            pi: Math.PI
        },
        {
            countryCode: 128,
            active: true,
            data: {
                num: 475475858
            },
            history: [{
                used: new Date(114),
                balance: 0xffff - 1
            }],
            pi: Math.PI
        }
    ],
    minutes: Date.now(),
    seed: Math.random(),
    shrt: 30000,
    ushrt: 10702,
    byte: -96,
    ubyte: 255,
    flt: 559825.54457
};

module.exports = user1;