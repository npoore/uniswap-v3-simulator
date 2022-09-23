"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdGenerator = void 0;
const uuid_1 = require("uuid");
class IdGenerator {
}
exports.IdGenerator = IdGenerator;
IdGenerator.guid = uuid_1.v4;
IdGenerator.validate = uuid_1.validate;
