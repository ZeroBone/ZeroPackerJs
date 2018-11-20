/*
 * Copyright (c) 2018 Alexander Mayorov (zerobone.ru, vk.com/alxmay) All rights reserved.
 */

const PackerSchema = require("./src/classes/PackerSchema");

const types = require("./src/enums/types");

class ZeroPacker {}

ZeroPacker.Schema = PackerSchema;

ZeroPacker.Type = types;

module.exports = ZeroPacker;