'use strict';
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

const util = require('util'),
    EventEmitter = require('events').EventEmitter,
    ZWAVE = require('./util/zwave-constants'),
    SERVER = { Capabilities: "server.Capabilities", Server: "server.Server" };

const mqtt = require('mqtt');

const rejectEvents = {
    'reconnect': 'info',
    'close': 'warn',
    'offline': 'warn',
    'error': 'error'
};

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/*
 * Zwave MQTT Middleware
 * 
 * This middleware is composed of the following functions:
 * 
 * 1. ZwaveMQTT
 *  - converts raw zwave payload into MQTT frame
 * * 
 * Usage: app.use(ZwaveMQTTMiddleware)
 * 
 * @class ZwaveMQTTMiddleware
 * @param app  IOPA AppBuilder App
 * @constructor
 * @public
 */
function ZwaveMqttMiddleware(app) {
    _classCallCheck(this, ZwaveMqttMiddleware);

    if (!app.properties[SERVER.Capabilities][ZWAVE.Capabilities][ZWAVE.Version])
        throw new Error("ZwaveMqttMiddleware requires embedded ZwaveServer");
}

module.exports = ZwaveMqttMiddleware;

ZwaveMqttMiddleware.prototype.invoke = function (context, next) {

    if (context[IOPA.Scheme] === "zwave:" && context[SERVER.Capabilities][MQTT.Capabilities] && context[SERVER.Capabilities][MQTT.Capabilities][SERVER.Server]) {

        context[MQTT.Body] = context[ZWAVE.RawPayload];
        context[MQTT.Topic] = context[IOPA.Path];
        return context[SERVER.Capabilities][MQTT.Capabilities][SERVER.Server].send(topic, body);

    } else if (context[IOPA.Scheme] === "mqtt:") {

        var topic = context[MQTT.Body];
        if (topic in context[SERVER.Capabilities][ZWAVE.Capabilities][SERVER.Server]) {
            context[ZWAVE.RawPayload] = context[MQTT.Body]
            return context[SERVER.Capabilities][ZWAVE.Capabilities][SERVER.Server][topic].send(context);
        }

        return next();

    } else

        return next();

}
