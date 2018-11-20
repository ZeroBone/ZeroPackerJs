/*
 * Copyright (c) 2018 Alexander Mayorov (zerobone.ru, vk.com/alxmay) All rights reserved.
 */

// const PacketWriter = require("./PackerWriter");

const ZeroBuffer = require("./ZeroBuffer");

const types = require("../enums/types");

const typeWriters = require("../enums/typewriters");

class PackerSchema {

    /**
     * PackerSchema constructor.
     * @param schema {*} the user schema defining the packet or the packet fragment.
     */
    constructor(schema) {

        if (typeof schema === "string") {

            this.type = schema;

        }
        else if (Array.isArray(schema)) {

            if (schema.length !== 1) {

                throw new TypeError("Schema-defining array should contain only 1 element, got: " + schema.length);

            }

            this.type = types.TYPE_ARRAY;

            // recursive class invocation from constructor
            this.subType = new PackerSchema(schema[0]);

        }
        else if (schema && typeof schema === "object") {

            this.type = types.TYPE_OBJECT;

            this.fields = Object
                .keys(schema)
                .sort()
                .map((key) => new PackerField(key, schema[key]));

        }
        else {

            throw new TypeError("Unknown type: " + schema);

        }

    }

    /**
     * Encodes the user data according to the schema.
     * @param packetId {Number} the packet id.
     * @param data {*} data to encode.
     * @return {ZeroBuffer} the encoded buffer.
     * @public
     */
    encode(packetId, data) {

        const bytesNeeded = this._encodeLoop(data, 2);

        // console.log("Bytes needed: " + bytesNeeded);

        // const buffer = new PacketWriter();

        const buffer = ZeroBuffer.create(bytesNeeded);

        buffer.safe(true);

        buffer.writeUShortBE(packetId);

        this._encode(data, buffer);

        // buffer.writeUIntBE(checkSum);

        return buffer;

    }

    /**
     * Loops through the schema and calculates the number of bytes needed to build the user data.
     * @param data {*} the user data.
     * @param byteCount {Number} number of bytes needed to allocate.
     * @return {Number} increased number of bytes needed to allocate.
     * @private
     */
    _encodeLoop(data, byteCount) {

        if (this.type === types.TYPE_ARRAY) {

            return byteCount + PackerSchema._encodeArrayLoop(data, this.subType, byteCount);

        }
        else if (this.type !== types.TYPE_OBJECT) {

            // some simple type.
            // e.g number or string

            // typeWriters[this.type].write(buffer, data);


            return byteCount + typeWriters[this.type].getWriteLength(data);

        }

        for (const field of this.fields) {

            const subValue = data[field.name];

            if (field.optional) {

                byteCount++;

                if (typeof subValue === "undefined") {

                    continue;

                }

            }

            if (!field.isArray) {

                // normal field

                byteCount = field.type._encodeLoop(subValue, byteCount);

                continue;

            }

            // it is an array

            byteCount = PackerSchema._encodeArrayLoop(subValue, field.type, byteCount);

            // PackerSchema._encodeArray(subValue, buffer, field.type);

        }

        return byteCount;

    }

    /**
     * Loopth through the schema and calculates the number of bytes needed to build the user array.
     * @param value {Array} the user array.
     * @param type {PackerSchema} the array element type.
     * @param byteCount {Number} previous number of bytes needed.
     * @return {Number} new number of bytes needed.
     * @private
     */
    static _encodeArrayLoop(value, type, byteCount) {

        if (!Array.isArray(value)) {

            throw new TypeError("Expected an array, got while writing an array: " + value);

        }

        byteCount += typeWriters.UINT.getWriteLength(value.length); // always 4 bytes

        for (const element of value) {

            byteCount = type._encodeLoop(element, byteCount);

        }

        return byteCount;

    }

    /**
     * Recursively writes the data to the buffer.
     * @param data {*} the user data.
     * @param buffer {ZeroBuffer} the buffer to write to.
     * @private
     */
    _encode(data, buffer) {

        if (this.type === types.TYPE_ARRAY) {

            PackerSchema._encodeArray(data, buffer, this.subType);

            return;

        }
        else if (this.type !== types.TYPE_OBJECT) {

            // some simple type.
            // e.g number or string

            typeWriters[this.type].write(buffer, data);

            return;

        }

        // the value should be an object
        // but still it is safer to check

        if (!data || typeof data !== "object") {

            throw new TypeError("Not an object, got " + data);

        }

        // start writing fields

        for (const field of this.fields) {

            const subValue = data[field.name];

            if (field.optional) {

                if (typeof subValue === "undefined") {

                    typeWriters.BOOLEAN.write(buffer, false);

                    continue;

                }
                else {

                    typeWriters.BOOLEAN.write(buffer, true);

                }

            }

            if (!field.isArray) {

                // normal field

                field.type._encode(subValue, buffer);

                continue;

            }

            // it is an array

            PackerSchema._encodeArray(subValue, buffer, field.type);

        }

    }

    /**
     * Encodes and writes the array to the resulting buffer.
     * @param value {Array} the array to write.
     * @param buffer {ZeroBuffer} the buffer to write to.
     * @param type {PackerSchema} the schema of the array elements.
     * @private
     */
    static _encodeArray(value, buffer, type) {

        if (!Array.isArray(value)) {

            throw new TypeError("Expected an array, got while writing an array: " + value);

        }

        typeWriters.UINT.write(buffer, value.length);

        for (const element of value) {

            type._encode(element, buffer);

        }

    }

    /**
     * Decodes the buffer according to the current schema.
     * @param buffer {ZeroBuffer} the buffer to decode.
     * @return {*} the data decoded.
     * @public
     */
    decode(buffer) {

        // const decodedPacket = {};

        return this._decode({}, buffer);

        // return decodedPacket;


    }

    /**
     * Recursively loops through the schema and attempts to decode the buffer according to it.
     * @param obj {Array|Object} the container for the data.
     * @param buffer {ZeroBuffer} the buffer to retrieve the information from.
     * @return {*} the user data decoded.
     * @private
     */
    _decode(obj, buffer) {

        if (this.type === types.TYPE_ARRAY) {

            return PackerSchema._decodeArray(buffer, this.subType);

        }

        if (this.type !== types.TYPE_OBJECT) {

            return typeWriters[this.type].read(buffer);

        }

        for (const field of this.fields) {

            const subValue = obj[field.name] = {};

            if (field.optional) {

                const isPresent = typeWriters.BOOLEAN.read(buffer);

                if (!isPresent) {

                    continue;

                }

            }

            if (!field.isArray) {

                // normal field

                obj[field.name] = field.type._decode(subValue, buffer);

                continue;

            }

            // it is an array

            obj[field.name] = PackerSchema._decodeArray(buffer, field.type);

        }

        return obj;

    }

    /**
     * Decodes the user array from the buffer using the specified type.
     * @param buffer {ZeroBuffer} the buffer to retrieve the information from.
     * @param type {PackerSchema} the schema representing the type.
     * @return {Array} the decoded array.
     * @private
     */
    static _decodeArray(buffer, type) {

        const arrayLength = buffer.readUIntBE();

        // obj[type.name] = [];

        const arr = [];

        for (let i = 0; i < arrayLength; i++) {

            arr.push(type._decode({}, buffer));

        }

        return arr;

    }

}

module.exports = PackerSchema;

const PackerField = require("./PackerField");