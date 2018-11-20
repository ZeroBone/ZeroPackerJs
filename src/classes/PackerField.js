/*
 * Copyright (c) 2018 Alexander Mayorov (zerobone.ru, vk.com/alxmay) All rights reserved.
 */

"use strict";

const PackerSchema = require("./PackerSchema");

// const typeWriters = require("../enums/typewriters");

class PackerField {

    /**
     * PackerField constructor.
     * @param name {String} name of the field.
     * @param type {String|Number} type of the field.
     */
    constructor(name, type) {

        this.optional = false;

        if (name.endsWith("_opt")) {

            this.optional = true;

            name = name.replace("_opt", "");

        }

        this.name = name;

        this.isArray = Array.isArray(type);

        if (this.isArray) {

            type = type[0];

        }

        this.type = new PackerSchema(type);

    }

}

module.exports = PackerField;