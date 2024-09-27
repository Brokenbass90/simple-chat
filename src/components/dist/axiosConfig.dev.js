"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _axios = _interopRequireDefault(require("axios"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

// import axios from 'axios';
// const instance = axios.create({
//   baseURL: process.env.REACT_APP_API_URL || '/api',
// });
// export default instance;
var instance = _axios["default"].create({
  baseURL: 'http://localhost:5000'
});

var _default = instance;
exports["default"] = _default;