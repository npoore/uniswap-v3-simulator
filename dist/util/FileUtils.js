"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatabaseNameFromPath = exports.exists = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
function exists(filePath) {
    try {
        fs_1.accessSync(filePath, fs_1.constants.F_OK);
        return true;
    }
    catch (err) {
        return false;
    }
}
exports.exists = exists;
function getDatabaseNameFromPath(filePath, extToMove) {
    return path_1.basename(filePath, extToMove);
}
exports.getDatabaseNameFromPath = getDatabaseNameFromPath;
