/*
 * Copyright (c) 2018 Alexander Mayorov (zerobone.ru, vk.com/alxmay) All rights reserved.
 */

"use strict";

class ZeroBuffer {

    /**
     * ZeroBuffer constructor.
     * @param obj {Object} settings.
     */
    constructor(obj) {

        this._bytes = obj.bytes;

        this._offset = 0;

        this._safe = true;

    }

    // private methods

    /**
     * Makes sure the specified amount of bytes is available for reading.
     * @param bytes {Number} number of bytes.
     * @throws if there is not enoupgh space to read.
     * @private
     */
    _requestRead(bytes) {

        if (this._offset + bytes > this._bytes.length) {

            throw new RangeError("Not enouph data while reading (truncated).");

        }

    }

    /**
     * Makes sure the specified amount of bytes is available for writing.
     * @param bytes {Number} number of bytes.
     * @throws if there is not enoupgh space to write.
     * @private
     */
    _requestWrite(bytes) {

        if (this._offset + bytes > this._bytes.length) {

            throw new RangeError("Not enouph data while writing (truncated).");

        }

    }

    /**
     * Reads a floting point number using IEEE754 standart.
     * @param buffer {Uint8Array|Buffer|Array} buffer or array-like object to write to.
     * @param offset {Number} how many bytes to skip before writing.
     * @param isLE {Boolean} whether to write in little endian or big endian.
     * @param mLen {Number} the mantissa length.
     * @param nBytes {Number} how many bytes to write.
     * @return {Number} number of bytes written.
     * @private
     */
    static _IEEE754read(buffer, offset, isLE, mLen, nBytes) {

        const eLen = (nBytes * 8) - mLen - 1;

        const eMax = (1 << eLen) - 1;

        const eBias = eMax >> 1;

        let nBits = -7;

        let i = isLE ? (nBytes - 1) : 0;

        const d = isLE ? -1 : 1;

        let s = buffer[offset + i];

        i += d;

        let e = s & ((1 << (-nBits)) - 1);

        s >>= (-nBits);

        nBits += eLen;

        for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

        let m = e & ((1 << (-nBits)) - 1);

        e >>= (-nBits);

        nBits += mLen;

        for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

        if (e === 0) {

            e = 1 - eBias;

        }
        else if (e === eMax) {

            return m ? NaN : ((s ? -1 : 1) * Infinity);

        }
        else {

            m = m + (2 ** mLen);

            e = e - eBias;

        }


        return (s ? -1 : 1) * m * (2 ** (e - mLen));

    }

    /**
     * Writes a floting point number using IEEE754 standart.
     * @param buffer {Uint8Array|Buffer|Array} buffer or array-like object to write to.
     * @param value {Number} the number to write to the buffer.
     * @param offset {Number} how many bytes to skip before writing.
     * @param isLE {Boolean} whether to write in little endian or big endian.
     * @param mLen {Number} the mantissa length.
     * @param nBytes {Number} how many bytes to write.
     * @return {Number} number of bytes written.
     * @private
     */
    static _IEEE754write(buffer, value, offset, isLE, mLen, nBytes) {

        let e;

        let m;

        let c;

        let eLen = (nBytes * 8) - mLen - 1;

        const eMax = (1 << eLen) - 1;

        const eBias = eMax >> 1;

        const rt = (mLen === 23 ? (2 ** -24) - (2 ** -77) : 0);

        let i = isLE ? 0 : (nBytes - 1);

        const d = isLE ? 1 : -1;

        const s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;


        value = Math.abs(value);

        if (isNaN(value) || value === Infinity) {

            m = isNaN(value) ? 1 : 0;

            e = eMax;

        }
        else {

            e = Math.floor(Math.log(value) / Math.LN2);

            if (value * (c = (2 ** -e)) < 1) {

                e--;

                c *= 2;

            }


            if (e + eBias >= 1) {

                value += rt / c;

            }
            else {

                value += rt * (2 ** (1 - eBias));

            }


            if (value * c >= 2) {

                e++;

                c /= 2;

            }

            if (e + eBias >= eMax) {

                m = 0;

                e = eMax;

            }
            else if (e + eBias >= 1) {

                m = ((value * c) - 1) * (2 ** mLen);

                e = e + eBias;

            }
            else {

                m = value * (2 ** (eBias - 1)) * (2 ** mLen);

                e = 0;

            }

        }

        for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

        e = (e << mLen) | m;

        eLen += mLen;

        for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

        buffer[offset + i - d] |= s * 128;

    }

    /**
     * Makes sure the integer is in the specified range to avoid unexpected values in the byte array.
     * @param value {Number} number to check.
     * @param min {Number} the minimum allowed value.
     * @param max {Number} the maximum allowed value.
     * @throws if the number does not fit the range.
     * @private
     */
    static _checkInt(value, min, max) {

        if (!isFinite(value)) {

            throw new TypeError("Invalid integer value: " + value);

        }

        if (value < min) {

            throw new RangeError("Integer underflow. The minimim value is " + min + ", got: " + value);

        }

        if (value > max) {

            throw new RangeError("Integer overflow. The maximum value is " + max + ", got: " + value);

        }

    }

    /**
     * Makes sure there is enouph space for writing a floting point number with IEEE754.
     * @param buffer {Array|Uint8Array|Buffer} any array-like object.
     * @param offset {Number} how many bytes to skip.
     * @param ext {Number} number of bytes required.
     * @private
     */
    static _checkIEEE754(buffer, offset, ext) {

        if (offset + ext > buffer.length) {

            throw new RangeError("IEEE754 index out of range.");

        }


        if (offset < 0) {

            throw new RangeError("IEEE754 offset out of range.");

        }

    }

    /**
     * Writes a 32 bit floating point number.
     * @param value {Number} the float value.
     * @param littleEndian {Boolean} whether to user little endian byte order.
     * @private
     */
    _writeFloat(value, littleEndian) {

        if (this._safe) {

            ZeroBuffer._checkIEEE754(this._bytes, this._offset, 4);

        }

        ZeroBuffer._IEEE754write(this._bytes, value, this._offset, littleEndian, 23, 4);

        // ieee754.write(buffer, value, offset, littleEndian, 23, 4);

        this._offset += 4;

    }

    /**
     * Writes a 64 bit floating point number.
     * @param value {Number} the float value.
     * @param littleEndian {Boolean} whether to user little endian byte order.
     * @private
     */
    _writeDouble(value, littleEndian) {

        if (this._safe) {

            ZeroBuffer._checkIEEE754(this._bytes, this._offset, 8);

        }

        ZeroBuffer._IEEE754write(this._bytes, value, this._offset, littleEndian, 52, 8);

        // ieee754.write(buf, value, offset, littleEndian, 52, 8)

        this._offset += 8;


    }

    /**
     * Copies a fragment of a byte sequence to the buffer.
     * @param bytes {Array} the source to copy from.
     * @param offset {Number} how many bytes to skip before copying.
     * @param length {Number} how many bytes to copy.
     * @private
     */
    _blit(bytes, offset, length) {

        /*for (let i = 0; i < length; ++i) {

            if (
                (i + offset >= this._bytes.length) ||
                (i >= bytes.length)
            ) {

                break;

            }

            this._bytes[i + offset] = bytes[i];

        }*/

        for (let i = 0; i < length; i++) {

            this._bytes[offset + i] = bytes[i];

        }

    }

    // helpers

    /**
     * Sets the read/write safety mode to avoid unexpected results.
     * @param value {Boolean} the mode flag.
     */
    safe(value = false) {

        this._safe = value;

    }

    /**
     * Sets the offset to start reading from of writing to.
     * @param newOffset {Number} the new offset.
     */
    setOffset(newOffset) {

        this._offset = newOffset;

    }

    /**
     * Gets the current buffer offset.
     * @return {Number} the offset.
     */
    getOffset() {

        return this._offset;

    }

    /**
     * Creates a buffer from the byte sequence.
     * @return {Buffer} the created buffer.
     */
    getBuffer() {

        return Buffer.from(this._bytes);

    }

    /**
     * Gets the byte sequence.
     * @return {Uint8Array} the byte sequence.
     */
    getByteArray() {

        return this._bytes;

    }

    /**
     * Convertes a string to an array of bytes.
     * @param string {String} the input string.
     * @param encoding {String|Number} the encoding to use.
     * @return {Array<number>} the bytes representing this string.
     */
    static stringToBytes(string, encoding) {

        return ZeroBuffer.stringCodecs[encoding].toBytes(string);

    }

    /*static stringFromBytes(bytes, encoding, start = 0, length = bytes.length) {

        return ZeroBuffer.stringCodecs[encoding].fromBytes(bytes, start, length);

    }*/

    // write methods

    /**
     * Writes an unsigned 8 bit integer to the buffer.
     * @param value {Number} number representing the byte.
     */
    writeUByte(value) {

        if (this._safe) {

            this._requestWrite(1);

            ZeroBuffer._checkInt(value, 0, ZeroBuffer.constants.MAX_UBYTE);

        }

        this._bytes[this._offset++] = value;



    }

    /**
     * Writes a signed 8 bit integer to the buffer.
     * @param value {Number} number representing the byte.
     */
    writeByte(value) {

        if (this._safe) {

            this._requestWrite(1);

            ZeroBuffer._checkInt(value, ZeroBuffer.constants.MIN_BYTE, ZeroBuffer.constants.MAX_BYTE);

        }

        if (value < 0) {

            value += 0xff + 1;

        }

        this._bytes[this._offset] = (value & 0xff);

        this._offset++;

    }

    /**
     * Writes an unsigned 16 bit integer to the buffer.
     * @param value {Number} number representing the short.
     */
    writeUShortBE(value) {

        if (this._safe) {

            this._requestWrite(2);

            ZeroBuffer._checkInt(value, 0, ZeroBuffer.constants.MAX_USHORT);

        }

        this._bytes[this._offset] = (value >>> 8);
        this._bytes[this._offset + 1] = (value & 0xff);

        this._offset += 2;

    }

    /**
     * Writes a signed 16 bit integer to the buffer.
     * @param value {Number} number representing the short.
     */
    writeShortBE(value) {

        if (this._safe) {

            this._requestWrite(2);

            ZeroBuffer._checkInt(value, ZeroBuffer.constants.MIN_SHORT, ZeroBuffer.constants.MAX_SHORT);

        }

        this._bytes[this._offset] = (value >>> 8);

        this._bytes[this._offset + 1] = (value & 0xff);

        this._offset += 2;

    }

    /**
     * Writes a signed 32 bit integer to the buffer.
     * @param value {Number} number representing the int.
     */
    writeIntBE(value) {

        if (this._safe) {

            this._requestWrite(4);

            ZeroBuffer._checkInt(value, ZeroBuffer.constants.MIN_INT, ZeroBuffer.constants.MAX_INT);

        }

        if (value < 0) {

            value = 0xffffffff + value + 1;

        }

        this._bytes[this._offset] = (value >>> 24);

        this._bytes[this._offset + 1] = (value >>> 16);

        this._bytes[this._offset + 2] = (value >>> 8);

        this._bytes[this._offset + 3] = (value & 0xff);

        this._offset += 4;

    }

    /**
     * Writes an unsigned 32 bit integer to the buffer.
     * @param value {Number} number representing the int.
     */
    writeUIntBE(value) {

        if (this._safe) {

            this._requestWrite(4);

            ZeroBuffer._checkInt(value, 0, ZeroBuffer.constants.MAX_UINT);

        }

        this._bytes[this._offset] = (value >>> 24);

        this._bytes[this._offset + 1] = (value >>> 16);

        this._bytes[this._offset + 2] = (value >>> 8);

        this._bytes[this._offset + 3] = (value & 0xff);

        this._offset += 4;

    }

    // varints

    /**
     * VarInt formats:
     * 7b	0xxx xxxx
     * 14b	10xx xxxx  xxxx xxxx
     * 29b	110x xxxx  xxxx xxxx  xxxx xxxx  xxxx xxxx
     * 61b	111x xxxx  xxxx xxxx  xxxx xxxx  xxxx xxxx  xxxx xxxx  xxxx xxxx  xxxx xxxx  xxxx xxxx
     */

    /**
     * Writes an unsigned VarUInt integer to the buffer.
     * @param value {Number} number representing the VarUInt.
     */
    writeVarUIntBE(value) {

        if (this._safe) {

            ZeroBuffer._checkInt(value, 0, ZeroBuffer.constants.VARINT_MAX_DOUBLE_INT);

        }

        if (value < ZeroBuffer.constants.VARINT_MAX_UBYTE) {

            this.writeUByte(value);

        }
        else if (value < ZeroBuffer.constants.VARINT_MAX_USHORT) {

            this.writeUShortBE(value + 0x8000);

        }
        else if (value < ZeroBuffer.constants.VARINT_MAX_UINT) {

            this.writeUIntBE(value + 0xc0000000);

        }
        else {

            // split in two 32 bit unsigned integers

            this.writeUIntBE(Math.floor(value / POWER_32) + 0xe0000000);

            this.writeUIntBE(value >>> 0);

        }

    }

    /**
     * Measures the amount of bytes the specified VarUInt will occupy.
     * @param value {Number} the number to be encoded in VarInt,
     * @return {Number} number of bytes needed. Can be 1, 2, 4 or 8.
     */
    static varUIntMeasure(value) {

        if (value < ZeroBuffer.constants.VARINT_MAX_UBYTE) {

            return 1;

        }
        else if (value < ZeroBuffer.constants.VARINT_MAX_USHORT) {

            return 2;

        }
        else if (value < ZeroBuffer.constants.VARINT_MAX_UINT) {

            return 4;

        }
        else {

            return 8;

        }

    }

    /**
     * Measures the amount of bytes the specified VarInt will occupy.
     * @param value {Number} the number to be encoded in VarInt,
     * @return {Number} number of bytes needed. Can be 1, 2, 4 or 8.
     */
    static varIntMeasure(value) {

        if (value >= -ZeroBuffer.constants.VARINT_MAX_BYTE && value < ZeroBuffer.constants.VARINT_MAX_BYTE) {

            return 1;

        }
        else if (value >= -ZeroBuffer.constants.VARINT_MAX_SHORT && value < ZeroBuffer.constants.VARINT_MAX_SHORT) {

            return 2;

        }
        else if (value >= -ZeroBuffer.constants.VARINT_MAX_INT && value < ZeroBuffer.constants.VARINT_MAX_INT) {

            return 4;

        }
        else {

            return 8;

        }

    }

    /**
     * Writes a signed VarInt integer to the buffer.
     * @param value {Number} number representing the VarInt.
     */
    writeVarIntBE(value) {

        if (this._safe) {

            ZeroBuffer._checkInt(value, -ZeroBuffer.constants.VARINT_MAX_DOUBLE_INT, ZeroBuffer.constants.VARINT_MAX_DOUBLE_INT);

        }

        if (value >= -ZeroBuffer.constants.VARINT_MAX_BYTE && value < ZeroBuffer.constants.VARINT_MAX_BYTE) {

            this.writeUByte(value & 0x7f);

        }
        else if (value >= -ZeroBuffer.constants.VARINT_MAX_SHORT && value < ZeroBuffer.constants.VARINT_MAX_SHORT) {

            this.writeUShortBE((value & 0x3fff) + 0x8000);

        }
        else if (value >= -ZeroBuffer.constants.VARINT_MAX_INT && value < ZeroBuffer.constants.VARINT_MAX_INT) {

            this.writeUIntBE((value & 0x1fffffff) + 0xc0000000);

        }
        else {

            // Split in two 32 bit unsigned integers

            this.writeUIntBE((Math.floor(value / POWER_32) & 0x1fffffff) + 0xe0000000);

            this.writeUIntBE(value >>> 0);

        }

    }

    // end varint writers

    /**
     * Writes a 32 bit floating point number to the buffer.
     * @param value {Number} number representing the float.
     */
    writeFloatBE(value) {

        if (this._safe) {

            this._requestWrite(4);

        }

        this._writeFloat(value, false);

    }

    /**
     * Writes a 32 bit floating point number to the buffer in little endian.
     * @param value {Number} number representing the float.
     */
    writeFloatLE(value) {

        if (this._safe) {

            this._requestWrite(4);

        }

        this._writeFloat(value, true);

    }

    /**
     * Writes a 64 bit floating point number to the buffer.
     * @param value {Number} number representing the double.
     */
    writeDoubleBE(value) {

        if (this._safe) {

            this._requestWrite(8);

        }

        this._writeDouble(value, false);

    }

    /**
     * Writes a 64 bit floating point number to the buffer in little endian.
     * @param value {Number} number representing the double.
     */
    writeDoubleLE(value) {

        if (this._safe) {

            this._requestWrite(8);

        }

        this._writeDouble(value, true);

    }

    // string writers

    /**
     * Writes a VarUInt prefixed string with a specified encoding to the buffer.
     * @param string {String} the string to write.
     * @param encoding {String|Number} the encoding to use while writing.
     */
    writeVString(string, encoding) {

        const stringBytes = ZeroBuffer.stringCodecs[encoding].toBytes(string);

        this.writeVarUIntBE(stringBytes.length);

        this._writeBytes(
            stringBytes,
            stringBytes.length
        );

    }

    /**
     * Writes a ubyte prefixed string with a specified encoding to the buffer.
     * @param string {String} the string to write.
     * @param encoding {String|Number} the encoding to use while writing.
     */
    writeBString(string, encoding) {

        const stringBytes = ZeroBuffer.stringCodecs[encoding].toBytes(string);

        this.writeUByte(stringBytes.length);

        this._writeBytes(
            stringBytes,
            stringBytes.length
        );

    }

    /**
     * Writes a ushort prefixed string with a specified encoding to the buffer.
     * @param string {String} the string to write.
     * @param encoding {String|Number} the encoding to use while writing.
     */
    writeSString(string, encoding) {

        const stringBytes = ZeroBuffer.stringCodecs[encoding].toBytes(string);

        this.writeUShortBE(stringBytes.length);

        this._writeBytes(
            stringBytes,
            stringBytes.length
        );

    }

    /**
     * Writes a uint prefixed string with a specified encoding to the buffer.
     * @param string {String} the string to write.
     * @param encoding {String|Number} the encoding to use while writing.
     */
    writeIString(string, encoding) {

        const stringBytes = ZeroBuffer.stringCodecs[encoding].toBytes(string);

        this.writeUIntBE(stringBytes.length);

        this._writeBytes(
            stringBytes,
            stringBytes.length
        );

    }

    /**
     * Writes the array of bytes to the buffer.
     * @param bytes {Array|Uint8Array} the array of bytes.
     * @param length {Number} the length to write.
     * @private
     */
    _writeBytes(bytes, length) {

        if (this._safe) {

            this._requestWrite(length);

        }

        this._blit(bytes, this._offset, length);

        this._offset += length;

    }

    /**
     * Writes a VarUInt prefixed string using an array of bytes
     * @param bytes {Array|Uint8Array} the array of bytes.
     */
    writeVStringBytes(bytes) {

        this.writeVarUIntBE(bytes.length);

        if (this._safe) {

            this._requestWrite(bytes.length);

        }

        this._blit(bytes, this._offset, bytes.length);

        this._offset += bytes.length;

    }

    /**
     * Writes a ubyte prefixed string using an array of bytes
     * @param bytes {Array|Uint8Array} the array of bytes.
     */
    writeBStringBytes(bytes) {

        this.writeUByte(bytes.length);

        if (this._safe) {

            this._requestWrite(bytes.length);

        }

        this._blit(bytes, this._offset, bytes.length);

        this._offset += bytes.length;

    }

    /**
     * Writes a ushort prefixed string using an array of bytes
     * @param bytes {Array|Uint8Array} the array of bytes.
     */
    writeSStringBytes(bytes) {

        this.writeUShortBE(bytes.length);

        if (this._safe) {

            this._requestWrite(bytes.length);

        }

        this._blit(bytes, this._offset, bytes.length);

        this._offset += bytes.length;

    }

    /**
     * Writes a uint prefixed string using an array of bytes
     * @param bytes {Array|Uint8Array} the array of bytes.
     */
    writeIStringBytes(bytes) {

        this.writeUIntBE(bytes.length);

        if (this._safe) {

            this._requestWrite(bytes.length);

        }

        this._blit(bytes, this._offset, bytes.length);

        this._offset += bytes.length;

    }

    // read methods

    /**
     * Reads an unsigned 8 bit integer from the buffer.
     * @return {Number} the read value.
     */
    readUByte() {

        this._requestRead(1);

        return this._bytes[this._offset++];

    }

    /**
     * Reads a signed 8 bit integer from the buffer.
     * @return {Number} the read value.
     */
    readByte() {

        this._requestRead(1);

        if (!(this._bytes[this._offset] & 0x80)) {

            return (this._bytes[this._offset++]);

        }

        return (
            (0xff - this._bytes[this._offset++] + 1) * -1
        );

    }

    /**
     * Reads an unsigned 16 bit integer from the buffer.
     * @return {Number} the read value.
     */
    readUShortBE() {

        this._requestRead(2);

        const value = (
            (this._bytes[this._offset] << 8) |
            this._bytes[this._offset + 1]
        );

        this._offset += 2;

        return value;

        /*return (
            (this._bytes[this._offset++] << 8) |
            this._bytes[this._offset++]
        );*/

    }

    /**
     * Reads a signed 16 bit integer from the buffer.
     * @return {Number} the read value.
     */
    readShortBE() {

        this._requestRead(2);

        const value = this._bytes[this._offset + 1] | (this._bytes[this._offset] << 8);

        this._offset += 2;

        return (
            (value & 0x8000) ?
            (value | 0xFFFF0000) :
            value
        );

    }

    /**
     * Reads an unsigned 32 bit integer from the buffer.
     * @return {Number} the read value.
     */
    readUIntBE() {

        this._requestRead(4);

        const value = (
            (this._bytes[this._offset] * 0x1000000) +
            (
                (this._bytes[this._offset + 1] << 16) |
                (this._bytes[this._offset + 2] << 8) |
                this._bytes[this._offset + 3]
            )
        );

        this._offset += 4;

        return value;

    }

    /**
     * Reads a signed 32 bit integer from the buffer.
     * @return {Number} the read value.
     */
    readIntBE() {

        this._requestRead(4);

        const value = (
            (this._bytes[this._offset] << 24) |
            (this._bytes[this._offset + 1] << 16) |
            (this._bytes[this._offset + 2] << 8) |
            (this._bytes[this._offset + 3])
        );

        this._offset += 4;

        return value;

    }

    /**
     * Reads an unsigned 8 bit integer without altering the offset.
     * @return {Number} the rad value.
     * @private
     */
    _peekUByte() {

        const value = this.readUByte();

        this._offset--;

        return value;

    }

    /**
     * Reads a signed VarInt from the buffer.
     * @return {Number} the read value.
     */
    readVarIntBE() {

        const firstByte = this._peekUByte();

        let i;

        if (!(firstByte & 0x80)) {

            this._offset++;

            return (
                (firstByte & 0x40) ?
                (firstByte | 0xffffff80) :
                firstByte
            );

        }
        else if (!(firstByte & 0x40)) {

            i = this.readUShortBE() - 0x8000;

            return (
                (i & 0x2000) ?
                (i | 0xffffc000) :
                i
            );

        }
        else if (!(firstByte & 0x20)) {

            i = this.readUIntBE() - 0xc0000000;

            return (
                (i & 0x10000000) ?
                (i | 0xe0000000) :
                i
            );

        }
        else {

            i = this.readUIntBE() - 0xe0000000;

            i = (
                (i & 0x10000000) ?
                (i | 0xe0000000) :
                i
            );

            return i * POWER_32 + this.readUIntBE();

        }

    }

    /**
     * Reads an unsigned VarInt from the buffer.
     * @return {Number} the read value.
     */
    readVarUIntBE() {

        const firstByte = this._peekUByte();

        if (!(firstByte & 0x80)) {

            this._offset++;

            return firstByte;

        }
        else if (!(firstByte & 0x40)) {

            return this.readUShortBE() - 0x8000;

        }
        else if (!(firstByte & 0x20)) {

            return this.readUIntBE() - 0xc0000000;

        }
        else {

            // 2 32-bit integers

            return (this.readUIntBE() - 0xe0000000) * POWER_32 + this.readUIntBE();

        }

    }


    /**
     * Reads a 32 bit floating point number from the buffer.
     * @return {Number} the read value.
     */
    readFloatBE() {

        this._requestRead(4);

        const value = ZeroBuffer._IEEE754read(this._bytes, this._offset, false, 23, 4);

        this._offset += 4;

        return value;

    }

    /**
     * Reads a 32 bit floating point number from the buffer in little endian byte order.
     * @return {Number} the read value.
     */
    readFloatLE() {

        this._requestRead(4);

        const value = ZeroBuffer._IEEE754read(this._bytes, this._offset, true, 23, 4);

        this._offset += 4;

        return value;

    }

    /**
     * Reads a 64 bit floating point number from the buffer.
     * @return {Number} the read value.
     */
    readDoubleBE() {

        this._requestRead(8);

        const value = ZeroBuffer._IEEE754read(this._bytes, this._offset, false, 52, 8);

        this._offset += 8;

        return value;

    }

    /**
     * Reads a 64 bit floating point number from the buffer in little endian.
     * @return {Number} the read value.
     */
    readDoubleLE() {

        this._requestRead(8);

        const value = ZeroBuffer._IEEE754read(this._bytes, this._offset, true, 52, 8);

        this._offset += 8;

        return value;

    }

    // string readers

    /**
     * Reads a VarUInt prefixed string from the buffer.
     * @param encoding {String|Number} the string encoding.
     * @return {String} the read string.
     */
    readVString(encoding) {

        const stringLength = this.readVarUIntBE();

        // console.log("String length from varUInt:", stringLength, "ofset:", this._offset);

        this._requestRead(stringLength);

        const value = ZeroBuffer.stringCodecs[encoding].fromBytes(this._bytes, this._offset, this._offset + stringLength);

        this._offset += stringLength;

        return value;

    }

    /**
     * Reads a ubyte prefixed string from the buffer.
     * @param encoding {String|Number} the string encoding.
     * @return {String} the read string.
     */
    readBString(encoding) {

        const stringLength = this.readUByte();

        this._requestRead(stringLength);

        const value = ZeroBuffer.stringCodecs[encoding].fromBytes(this._bytes, this._offset, this._offset + stringLength);

        this._offset += stringLength;

        return value;

    }

    /**
     * Reads a ushort prefixed string from the buffer.
     * @param encoding {String|Number} the string encoding.
     * @return {String} the read string.
     */
    readSString(encoding) {

        const stringLength = this.readUShortBE();

        this._requestRead(stringLength);

        const value = ZeroBuffer.stringCodecs[encoding].fromBytes(this._bytes, this._offset, this._offset + stringLength);

        this._offset += stringLength;

        return value;

    }

    /**
     * Reads a uint prefixed string from the buffer.
     * @param encoding {String|Number} the string encoding.
     * @return {String} the read string.
     */
    readIString(encoding) {

        const stringLength = this.readUIntBE();

        this._requestRead(stringLength);

        const value = ZeroBuffer.stringCodecs[encoding].fromBytes(this._bytes, this._offset, this._offset + stringLength);

        this._offset += stringLength;

        return value;

    }

    // static methods

    /**
     * Factory function that creates a new ZeroBuffer.
     * @param length {Number,optional} the number of bytes to allocate.
     * @return {ZeroBuffer} the created ZeroBuffer instance.
     */
    static create(length = 128) {

        return new ZeroBuffer({
            // bytes: new Uint8Array(length)
            bytes: length > 0 ? new Uint8Array(length) : []
        });

    }

    /**
     * Factory function that creates a new ZeroBuffer from a NodeJS buffer.
     * @param buffer {Buffer} the buffer.
     * @return {ZeroBuffer} the created instance.
     */
    static fromBuffer(buffer) {

        return new ZeroBuffer({
            bytes: new Uint8Array(buffer, 0, buffer.length)
        });

    }

    /**
     * Factory function that creates a new ZeroBuffer from a byte array.
     * @param uInt8Array {Uint8Array} the array of bytes.
     * @return {ZeroBuffer} the created instance.
     */
    static fromByteArray(uInt8Array) {

        return new ZeroBuffer({
            bytes: uInt8Array
        });

    }

}

// math constants

const POWER_32 = 2 ** 32;

ZeroBuffer.constants = {
    // unsigned max values
    MAX_UBYTE: 0xff, // 255
    MAX_USHORT: 0xffff, // 65535
    MAX_UINT: 0xffffffff, // 4294967295

    MAX_BYTE: 0x7f, // 127
    MIN_BYTE: -0x80, // -128

    MAX_SHORT: 0x7fff, // 32767
    MIN_SHORT: -0x8000, // -32768

    MAX_INT: 0x7fffffff,
    MIN_INT: -0x80000000,

    VARINT_MAX_DOUBLE_INT: Number.MAX_SAFE_INTEGER,

    VARINT_MAX_UBYTE: 2 ** 7,

    VARINT_MAX_USHORT: 2 ** 14,

    VARINT_MAX_UINT: 2 ** 29,

    VARINT_MAX_BYTE: 2 ** 6,

    VARINT_MAX_SHORT: 2 ** 13,

    VARINT_MAX_INT: 2 ** 28,

    ENCODING_UTF8: "UTF8",
    ENCODING_ASCII: "ASCII",

    _MAX_ARGUMENTS: 1000
};

ZeroBuffer.stringCodecs = {
    UTF8: {
        /**
         * Converts a string to a UTF8 byte sequence.
         * @param string {String} the string to convert.
         * @param units {Number} units.
         * @return {Array} the string bytes.
         */
        toBytes(string, units = Infinity) {

            let codePoint;

            let leadSurrogate = null;

            const bytes = [];

            for (let i = 0; i < string.length; ++i) {

                codePoint = string.charCodeAt(i);

                // is surrogate component
                if (codePoint > 0xD7FF && codePoint < 0xE000) {

                    // last char was a lead
                    if (!leadSurrogate) {

                        // no lead yet
                        if (codePoint > 0xDBFF) {

                            // unexpected trail
                            if ((units -= 3) > -1) {

                                bytes.push(0xEF, 0xBF, 0xBD);

                            }

                            continue;

                        }
                        else if (i + 1 === string.length) {

                            // unpaired lead
                            if ((units -= 3) > -1) {

                                bytes.push(0xEF, 0xBF, 0xBD);

                            }

                            continue;

                        }

                        // valid lead
                        leadSurrogate = codePoint;

                        continue;

                    }

                    // 2 leads in a row
                    if (codePoint < 0xDC00) {

                        if ((units -= 3) > -1) {

                            bytes.push(0xEF, 0xBF, 0xBD);

                        }

                        leadSurrogate = codePoint;

                        continue;

                    }

                    // valid surrogate pair
                    codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000;

                }
                else if (leadSurrogate) {

                    // valid bmp char, but last char was a lead
                    if ((units -= 3) > -1) {

                        bytes.push(0xEF, 0xBF, 0xBD);

                    }
                }

                leadSurrogate = null;

                // encode utf8
                if (codePoint < 0x80) {

                    if ((units -= 1) < 0) {

                        break;

                    }

                    bytes.push(codePoint);

                }
                else if (codePoint < 0x800) {

                    if ((units -= 2) < 0) {

                        break;

                    }

                    bytes.push(
                        codePoint >> 0x6 | 0xC0,
                        codePoint & 0x3F | 0x80
                    );

                }
                else if (codePoint < 0x10000) {

                    if ((units -= 3) < 0) {

                        break;

                    }

                    bytes.push(
                        codePoint >> 0xC | 0xE0,
                        codePoint >> 0x6 & 0x3F | 0x80,
                        codePoint & 0x3F | 0x80
                    );

                }
                else if (codePoint < 0x110000) {

                    if ((units -= 4) < 0) {

                        break;

                    }

                    bytes.push(
                        codePoint >> 0x12 | 0xF0,
                        codePoint >> 0xC & 0x3F | 0x80,
                        codePoint >> 0x6 & 0x3F | 0x80,
                        codePoint & 0x3F | 0x80
                    );

                }
                else {

                    throw new TypeError("Invalid code point");

                }

            }

            return bytes;

        },
        /**
         * Converts the UTF8 byte sequence to a string.
         * @param buffer {Array|Uint8Array|Buffer} the buffer to process.
         * @param start {Number} the starting point.
         * @param end {Number} the ending point.
         * @return {String} the decoded string.
         */
        fromBytes(buffer, start, end) {

            // end = Math.min(buffer.length, end);

            const result = [];

            let i = start;

            while (i < end) {

                const firstByte = buffer[i];

                let codePoint = null;

                let bytesPerSequence = (firstByte > 0xEF) ? 4
                    : (firstByte > 0xDF) ? 3
                    : (firstByte > 0xBF) ? 2
                    : 1;

                if (i + bytesPerSequence <= end) {

                    let secondByte;

                    let thirdByte;

                    let fourthByte;

                    let tempCodePoint;

                    switch (bytesPerSequence) {


                        case 1:

                            if (firstByte < 0x80) {

                                codePoint = firstByte;

                            }

                            break;

                        case 2:

                            secondByte = buffer[i + 1];

                            if ((secondByte & 0xC0) === 0x80) {

                                tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F);

                                if (tempCodePoint > 0x7F) {

                                    codePoint = tempCodePoint;

                                }

                            }

                            break;

                        case 3:

                            secondByte = buffer[i + 1];

                            thirdByte = buffer[i + 2];

                            if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {

                                tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F);

                                if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {

                                    codePoint = tempCodePoint;

                                }

                            }

                            break;

                        case 4:

                            secondByte = buffer[i + 1];

                            thirdByte = buffer[i + 2];

                            fourthByte = buffer[i + 3];

                            if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {

                                tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F);

                                if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {

                                    codePoint = tempCodePoint;

                                }

                            }
                    }
                }

                if (codePoint === null) {

                    // we did not generate a valid codePoint so insert a
                    // replacement char (U+FFFD) and advance only 1 byte
                    codePoint = 0xFFFD;

                    bytesPerSequence = 1;


                }
                else if (codePoint > 0xFFFF) {

                    // encode to utf16 (surrogate pair dance)

                    codePoint -= 0x10000;

                    result.push(codePoint >>> 10 & 0x3FF | 0xD800);

                    codePoint = 0xDC00 | codePoint & 0x3FF;

                }


                result.push(codePoint);

                i += bytesPerSequence;

            }

            return this.decodeCodePointsArray(result);

        },
        /**
         * Helper function to decode a UTF8 byte sequence to a string.
         * @param codePoints {Array} code points.
         * @return {String} the decoded string.
         */
        decodeCodePointsArray(codePoints) {

            if (codePoints.length <= ZeroBuffer.constants._MAX_ARGUMENTS) {

                return String.fromCharCode.apply(String, codePoints); // avoid extra slice()

            }

            // Decode in chunks to avoid "call stack size exceeded".

            let result = "";

            let i = 0;

            while (i < codePoints.length) {

                result += String.fromCharCode.apply(
                    String,
                    codePoints.slice(i, i += ZeroBuffer.constants._MAX_ARGUMENTS)
                );

            }

            return result;

        }
    },
    ASCII: {
        /**
         * Converts a string to a ASCII byte sequence.
         * @param string {String} the string to convert.
         * @return {Array} the string bytes.
         */
        toBytes(string) {

            const byteArray = [];

            for (let i = 0; i < string.length; ++i) {

                // Node's code seems to be doing this and not & 0x7F..
                byteArray.push(string.charCodeAt(i) & 0xFF);

            }

            return byteArray;

        },
        /**
         * Converts the ASCII byte sequence to a string.
         * @param buffer {Array|Uint8Array|Buffer} the buffer to process.
         * @param start {Number} the starting point.
         * @param end {Number} the ending point.
         * @return {String} the decoded string.
         */
        fromBytes(buffer, start, end) {

            let result = "";

            // end = Math.min(buffer.length, end)

            for (let i = start; i < end; ++i) {

                result += String.fromCharCode(buffer[i] & 0x7F);

            }

            return result;

        }
    }
};

module.exports = ZeroBuffer;