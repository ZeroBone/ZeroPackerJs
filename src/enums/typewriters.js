/*
 * Copyright (c) 2018 Alexander Mayorov (zerobone.ru, vk.com/alxmay) All rights reserved.
 */

const ZeroBuffer = require("../classes/ZeroBuffer");

const typeWriters = {
    VSTRING: {
        /**
         * Writes this type.
         * @param buffer {ZeroBuffer} the buffer.
         * @param value {*} the user value.
         */
        write(buffer, value) {

            buffer.writeVString(value, ZeroBuffer.constants.ENCODING_UTF8);

        },
        /**
         * Reads this type.
         * @param buffer {ZeroBuffer}
         * @return {String} the read string.
         */
        read(buffer) {

            return buffer.readVString(ZeroBuffer.constants.ENCODING_UTF8);

        },
        /**
         * Gets the length of this type in bytes.
         * @param value {*} the user value.
         * @return {Number} number of bytes needed to write this value.
         */
        getWriteLength(value) {

            const stringBytes = ZeroBuffer.stringToBytes(value, ZeroBuffer.constants.ENCODING_UTF8);

            return stringBytes.length + ZeroBuffer.varUIntMeasure(stringBytes.length);

        }
    },
    BSTRING: {
        /**
         * Writes this type.
         * @param buffer {ZeroBuffer} the buffer.
         * @param value {*} the user value.
         */
        write(buffer, value) {

            buffer.writeBString(value, ZeroBuffer.constants.ENCODING_UTF8);

        },
        /**
         * Reads this type.
         * @param buffer {ZeroBuffer}
         * @return {String} the read string.
         */
        read(buffer) {

            return buffer.readBString(ZeroBuffer.constants.ENCODING_UTF8);

        },
        /**
         * Gets the length of this type in bytes.
         * @return {Number} number of bytes needed to write this value.
         */
        getWriteLength(value) {

            return ZeroBuffer.stringToBytes(value, ZeroBuffer.constants.ENCODING_UTF8).length + 1;

        }
    },
    SSTRING: {
        /**
         * Writes this type.
         * @param buffer {ZeroBuffer} the buffer.
         * @param value {*} the user value.
         */
        write(buffer, value) {

            buffer.writeSString(value, ZeroBuffer.constants.ENCODING_UTF8);

        },
        /**
         * Reads this type.
         * @param buffer {ZeroBuffer}
         * @return {String} the read string.
         */
        read(buffer) {

            return buffer.readSString(ZeroBuffer.constants.ENCODING_UTF8);

        },
        /**
         * Gets the length of this type in bytes.
         * @param value {String} the string.
         * @return {Number} number of bytes needed to write this value.
         */
        getWriteLength(value) {

            return ZeroBuffer.stringToBytes(value, ZeroBuffer.constants.ENCODING_UTF8).length + 2;

        }
    },
    ISTRING: {
        /**
         * Writes this type.
         * @param buffer {ZeroBuffer} the buffer.
         * @param value {*} the user value.
         */
        write(buffer, value) {

            buffer.writeIString(value, ZeroBuffer.constants.ENCODING_UTF8);

        },
        /**
         * Reads this type.
         * @param buffer {ZeroBuffer}
         * @return {String} the read string.
         */
        read(buffer) {

            return buffer.readIString(ZeroBuffer.constants.ENCODING_UTF8);

        },
        /**
         * Gets the length of this type in bytes.
         * @param value {*} the user value.
         * @return {Number} number of bytes needed to write this value.
         */
        getWriteLength(value) {

            return ZeroBuffer.stringToBytes(value, ZeroBuffer.constants.ENCODING_UTF8).length + 4;

        }
    },
    UINT: {
        /**
         * Writes this type.
         * @param buffer {ZeroBuffer} the buffer.
         * @param value {*} the user value.
         */
        write(buffer, value) {

            buffer.writeUIntBE(value);

        },
        /**
         * Reads this type.
         * @param buffer {ZeroBuffer}
         * @return {Number} the read string.
         */
        read(buffer) {

            return buffer.readUIntBE();

        },
        /**
         * Gets the length of this type in bytes.
         * @return {Number} number of bytes needed to write this value.
         */
        getWriteLength: () => 4
    },
    INT: {
        /**
         * Writes this type.
         * @param buffer {ZeroBuffer} the buffer.
         * @param value {*} the user value.
         */
        write(buffer, value) {

            buffer.writeIntBE(value);

        },
        /**
         * Reads this type.
         * @param buffer {ZeroBuffer}
         * @return {Number} the read string.
         */
        read(buffer) {

            return buffer.readIntBE();

        },
        /**
         * Gets the length of this type in bytes.
         * @return {Number} number of bytes needed to write this value.
         */
        getWriteLength: () => 4
    },
    USHORT: {
        /**
         * Writes this type.
         * @param buffer {ZeroBuffer} the buffer.
         * @param value {*} the user value.
         */
        write(buffer, value) {

            buffer.writeUShortBE(value);

        },
        /**
         * Reads this type.
         * @param buffer {ZeroBuffer}
         * @return {Number} the read string.
         */
        read(buffer) {

            return buffer.readUShortBE();

        },
        /**
         * Gets the length of this type in bytes.
         * @return {Number} number of bytes needed to write this value.
         */
        getWriteLength: () => 2
    },
    SHORT: {
        /**
         * Writes this type.
         * @param buffer {ZeroBuffer} the buffer.
         * @param value {*} the user value.
         */
        write(buffer, value) {

            buffer.writeShortBE(value);

        },
        /**
         * Reads this type.
         * @param buffer {ZeroBuffer}
         * @return {Number} the read string.
         */
        read(buffer) {

            return buffer.readShortBE();

        },
        /**
         * Gets the length of this type in bytes.
         * @return {Number} number of bytes needed to write this value.
         */
        getWriteLength: () => 2
    },
    UBYTE: {
        /**
         * Writes this type.
         * @param buffer {ZeroBuffer} the buffer.
         * @param value {*} the user value.
         */
        write(buffer, value) {

            buffer.writeUByte(value);

        },
        /**
         * Reads this type.
         * @param buffer {ZeroBuffer}
         * @return {Number} the read string.
         */
        read(buffer) {

            return buffer.readUByte();

        },
        /**
         * Gets the length of this type in bytes.
         * @return {Number} number of bytes needed to write this value.
         */
        getWriteLength: () => 1
    },
    BYTE: {
        /**
         * Writes this type.
         * @param buffer {ZeroBuffer} the buffer.
         * @param value {*} the user value.
         */
        write(buffer, value) {

            buffer.writeByte(value);

        },
        /**
         * Reads this type.
         * @param buffer {ZeroBuffer}
         * @return {Number} the read string.
         */
        read(buffer) {

            return buffer.readByte();

        },
        /**
         * Gets the length of this type in bytes.
         * @return {Number} number of bytes needed to write this value.
         */
        getWriteLength: () => 1
    },
    VARINT: {
        /**
         * Writes this type.
         * @param buffer {ZeroBuffer} the buffer.
         * @param value {*} the user value.
         */
        write(buffer, value) {

            buffer.writeVarIntBE(value);

        },
        /**
         * Reads this type.
         * @param buffer {ZeroBuffer}
         * @return {Number} the read string.
         */
        read(buffer) {

            return buffer.readVarIntBE();

        },
        /**
         * Gets the length of this type in bytes.
         * @param value {*} the user value.
         * @return {Number} number of bytes needed to write this value.
         */
        getWriteLength(value) {

            return ZeroBuffer.varIntMeasure(value);

        }
    },
    VARUINT: {
        /**
         * Writes this type.
         * @param buffer {ZeroBuffer} the buffer.
         * @param value {*} the user value.
         */
        write(buffer, value) {

            buffer.writeVarUIntBE(value);

        },
        /**
         * Reads this type.
         * @param buffer {ZeroBuffer}
         * @return {Number} the read string.
         */
        read(buffer) {

            return buffer.readVarUIntBE();

        },
        /**
         * Gets the length of this type in bytes.
         * @param value {*} the user value.
         * @return {Number} number of bytes needed to write this value.
         */
        getWriteLength(value) {

            return ZeroBuffer.varUIntMeasure(value);

        }
    },
    FLOAT: {
        /**
         * Writes this type.
         * @param buffer {ZeroBuffer} the buffer.
         * @param value {*} the user value.
         */
        write(buffer, value) {

            buffer.writeFloatBE(value);

        },
        /**
         * Reads this type.
         * @param buffer {ZeroBuffer}
         * @return {Number} the read string.
         */
        read(buffer) {

            return buffer.readFloatBE();

        },
        /**
         * Gets the length of this type in bytes.
         * @return {Number} number of bytes needed to write this value.
         */
        getWriteLength: () => 4
    },
    DOUBLE: {
        /**
         * Writes this type.
         * @param buffer {ZeroBuffer} the buffer.
         * @param value {*} the user value.
         */
        write(buffer, value) {

            buffer.writeDoubleBE(value);

        },
        /**
         * Reads this type.
         * @param buffer {ZeroBuffer}
         * @return {Number} the read string.
         */
        read(buffer) {

            return buffer.readDoubleBE();

        },
        /**
         * Gets the length of this type in bytes.
         * @return {Number} number of bytes needed to write this value.
         */
        getWriteLength: () => 8
    },
    BOOLEAN: {
        /**
         * Writes this type.
         * @param buffer {ZeroBuffer} the buffer.
         * @param value {*} the user value.
         */
        write(buffer, value) {

            buffer.writeUByte(value ? 1 : 0);

        },
        /**
         * Reads this type.
         * @param buffer {ZeroBuffer}
         * @return {Boolean} the read string.
         */
        read(buffer) {

            return !!buffer.readUByte();

        },
        /**
         * Gets the length of this type in bytes.
         * @return {Number} number of bytes needed to write this value.
         */
        getWriteLength: () => 1
    },
    DATE: {
        /**
         * Writes this type.
         * @param buffer {ZeroBuffer} the buffer.
         * @param value {*} the user value.
         */
        write(buffer, value) {

            if (!(value instanceof Date)) {

                throw new TypeError("Expected a Date class instance, got: " + value);

            }

            const timestamp = value.getTime();

            if (isNaN(timestamp)) {

                throw new TypeError("Invalid Date object: " + value);

            }

            buffer.writeVarUIntBE(timestamp);

        },
        /**
         * Reads this type.
         * @param buffer {ZeroBuffer}
         * @return {Date} the read string.
         */
        read(buffer) {

            return new Date(buffer.readVarUIntBE());

        },
        /**
         * Gets the length of this type in bytes.
         * @param value {*} the user value.
         * @return {Number} number of bytes needed to write this value.
         */
        getWriteLength(value) {

            return ZeroBuffer.varUIntMeasure(value);

        }
    },
    REGEXP: {
        /**
         * Writes this type.
         * @param buffer {ZeroBuffer} the buffer.
         * @param value {*} the user value.
         */
        write(buffer, value) {

            if (!(value instanceof RegExp)) {

                throw new TypeError("Not a RegExp, got: " + value);

            }

            // typeWriters.STRING.write(value.source, buffer);
            buffer.writeVString(value.source, ZeroBuffer.constants.ENCODING_UTF8);

            // write a bit mask

            const g = value.global ? 1 : 0;
            const i = value.ignoreCase ? 2 : 0;
            const m = value.multiline ? 4 : 0;

            buffer.writeUByte(g + i + m);

        },
        /**
         * Reads this type.
         * @param buffer {ZeroBuffer}
         * @return {RegExp} the read string.
         */
        read(buffer) {

            const source = buffer.readVString(ZeroBuffer.constants.ENCODING_UTF8);

            const flags = buffer.readUByte();

            // read bit mask

            const g = flags & 0x1 ? "g" : "";

            const i = flags & 0x2 ? "i" : "";

            const m = flags & 0x4 ? "m" : "";

            return new RegExp(source, g + i + m);

        },
        /**
         * Gets the length of this type in bytes.
         * @param value {*} the user value.
         * @return {Number} number of bytes needed to write this value.
         */
        getWriteLength(value) {

            const sourceBytes = ZeroBuffer.stringToBytes(value.source, ZeroBuffer.constants.ENCODING_UTF8);

            return ZeroBuffer.varUIntMeasure(sourceBytes.length) + sourceBytes.length + 1;

        }
    }
};

module.exports = typeWriters;