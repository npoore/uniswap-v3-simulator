"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transition = void 0;
const Serializer_1 = require("../util/Serializer");
class Transition {
    constructor(source, record) {
        this._source = source;
        this._record = record;
    }
    get source() {
        return this._source;
    }
    get target() {
        return this._target;
    }
    set target(value) {
        this._target = value;
    }
    get record() {
        return this._record;
    }
    getSource() {
        return this.source;
    }
    getTarget() {
        return this.target;
    }
    getRecord() {
        return this.record;
    }
    accept(visitor) {
        return visitor.visitTransition(this);
    }
    toString() {
        return `
    Transition:
        sourcePoolStateId: ${this.source.id}
        targetPoolStateId: ${this.target.id}
    Record: 
        id: ${this.record.id}
        actionType: ${this.record.actionType}
        actionParams: ${Serializer_1.printParams(this.record.actionParams)}
        actionReturnValues: ${Serializer_1.printParams(this.record.actionReturnValues)}
        timestamp: ${this.record.timestamp}
    `;
    }
}
exports.Transition = Transition;
