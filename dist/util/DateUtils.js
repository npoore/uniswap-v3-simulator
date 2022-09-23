"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.format = exports.getTomorrow = exports.getYesterday = exports.getDate = void 0;
function getDate(year, month, day, hour = 0, minute = 0, second = 0, millisecond = 0) {
    let date = new Date();
    date.setFullYear(year, month - 1, day);
    date.setHours(hour, minute, second, millisecond);
    return date;
}
exports.getDate = getDate;
function getYesterday(date) {
    return new Date(date.getTime() - 24 * 60 * 60 * 1000);
}
exports.getYesterday = getYesterday;
function getTomorrow(date) {
    return new Date(date.getTime() + 24 * 60 * 60 * 1000);
}
exports.getTomorrow = getTomorrow;
function format(date, fmt) {
    var o = {
        "M+": date.getMonth() + 1,
        "d+": date.getDate(),
        "H+": date.getHours(),
        "m+": date.getMinutes(),
        "s+": date.getSeconds(),
        "q+": Math.floor((date.getMonth() + 3) / 3),
        S: date.getMilliseconds(),
    };
    if (/(y+)/.test(fmt))
        fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
    let k;
    for (k in o)
        if (new RegExp("(" + k + ")").test(fmt))
            fmt = fmt.replace(RegExp.$1, RegExp.$1.length == 1
                ? "" + o[k]
                : ("00" + o[k]).substr(("" + o[k]).length));
    return fmt;
}
exports.format = format;
