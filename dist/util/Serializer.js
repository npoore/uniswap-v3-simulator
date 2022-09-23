"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.printParams = exports.NumberArrayDeserializer = exports.NumberArraySerializer = exports.JSBIDeserializer = exports.JSBISerializer = exports.Serializer = void 0;
const jsbi_1 = __importDefault(require("jsbi"));
const typedjson_1 = require("typedjson");
const InternalConstants_1 = require("../enum/InternalConstants");
class Serializer {
    static serialize(rootConstructor, object) {
        let serializer = new typedjson_1.TypedJSON(rootConstructor);
        return serializer.stringify(object);
    }
    static deserialize(rootConstructor, jsonStr) {
        let serializer = new typedjson_1.TypedJSON(rootConstructor);
        return serializer.parse(jsonStr);
    }
}
exports.Serializer = Serializer;
const JSBISerializer = (jsbi) => jsbi.toString();
exports.JSBISerializer = JSBISerializer;
const JSBIDeserializer = (str) => str == undefined ? InternalConstants_1.ZERO : jsbi_1.default.BigInt(str);
exports.JSBIDeserializer = JSBIDeserializer;
const NumberArraySerializer = (arr) => JSON.stringify(arr);
exports.NumberArraySerializer = NumberArraySerializer;
const NumberArrayDeserializer = (str) => JSON.parse(str);
exports.NumberArrayDeserializer = NumberArrayDeserializer;
function printParams(params) {
    let str = "{";
    for (let key in params) {
        let value = params[key];
        str += key + ": " + (isObject(value) ? value.toString() : value) + ", ";
    }
    if (str.lastIndexOf(" ") == str.length - 1)
        str = str.slice(0, -2);
    str += "}";
    return str;
}
exports.printParams = printParams;
function isObject(value) {
    return typeof value === "object";
}
