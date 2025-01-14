"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeDeep = exports.loadConfig = void 0;
const path_1 = __importDefault(require("path"));
const fs = __importStar(require("fs"));
function loadConfig(file) {
    let customJson = {};
    const configFile = file || path_1.default.join(process.cwd(), "tuner.config.js");
    try {
        customJson = require(configFile);
    }
    catch (e) {
        if (fs.existsSync(configFile)) {
            throw new Error(`Cannot read Tuner JSON: ${configFile}: ${e}`);
        }
    }
    const defaultJson = require(path_1.default.join(__dirname, "..", "..", "tuner.config.js"));
    const merged = mergeDeep(defaultJson, customJson);
    return {
        ...merged,
    };
}
exports.loadConfig = loadConfig;
function mergeDeep(target, source) {
    const isObject = (obj) => obj && typeof obj === "object";
    if (!isObject(target) || !isObject(source)) {
        return source;
    }
    Object.keys(source).forEach((key) => {
        const targetValue = target[key];
        const sourceValue = source[key];
        if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
            target[key] = sourceValue; // Always use source key, if given
        }
        else if (isObject(targetValue) && isObject(sourceValue)) {
            target[key] = mergeDeep(Object.assign({}, targetValue), sourceValue);
        }
        else {
            target[key] = sourceValue;
        }
    });
    return target;
}
exports.mergeDeep = mergeDeep;
