"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toString = exports.Roadmap = void 0;
const IdGenerator_1 = require("../util/IdGenerator");
class Roadmap {
    constructor(description, snapshots) {
        this.id = IdGenerator_1.IdGenerator.guid();
        this.description = description;
        this.snapshots = snapshots;
        this.timestamp = new Date();
    }
}
exports.Roadmap = Roadmap;
function toString(roadmap) {
    return `
    Roadmap:
        id: ${roadmap.id}
        description: ${roadmap.description}
        snapshotLength: ${roadmap.snapshots.length}
        timestamp: ${roadmap.timestamp}
  `;
}
exports.toString = toString;
