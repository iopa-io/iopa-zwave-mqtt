/*
 * Copyright (c) 2017 Internet of Protocols Alliance (IOPA)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

const
  ZwaveMqttMiddleware = require('./zwave-mqtt-middleware'),
  ZwaveTransportMiddleware = require('./zwave-transport-middleware'),
  ZwaveTransportServer = require('./zwave-transport-server');

function ZwaveServer(app) {
  app.use("zwave:", ZwaveTransportServer);
  app.use(ZwaveTransportMiddleware);
}

function ZwaveMqtt(app) {
  app.use(ZwaveMqttMiddleware);
}

module.exports.ZwaveServer = ZwaveServer;
module.exports.ZwaveMqtt = ZwaveMqtt;