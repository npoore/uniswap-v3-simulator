"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateConverter = void 0;
const dayjs_1 = __importDefault(require("dayjs"));
class DateConverter {
    static parseDate(dateStr) {
        return dayjs_1.default(dateStr).toDate();
    }
    static formatDate(date, formatStr) {
        return dayjs_1.default(date).format(formatStr);
    }
}
exports.DateConverter = DateConverter;
