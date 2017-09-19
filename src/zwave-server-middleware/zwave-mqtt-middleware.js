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
    ZWAVE = require('./zwave-constants'),
    SERVER = { Capabilities: "server.Capabilities", Server: "server.Server" };

const mqtt = require('mqtt'),
    util = require('util');

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
function ZwaveMQTTMiddleware(app) {
    _classCallCheck(this, ZwaveTransportMiddleware);

    if (!app.properties[SERVER.Capabilities][ZWAVE.Capabilities][ZWAVE.Version])
        throw new Error("ZwaveMQTTMiddleware requires embedded ZwaveServer");
}

module.exports = ZwaveMQTTMiddleware;

ZwaveMQTTMiddleware._mqttInit = function(options) {
    
        var config = options.config;
    
        config.mqtt.options.will = {
            topic: config.root + "/" + options.locationid + "/" + options.platformid + "/" + "offline",
            payload: 'connection closed abnormally',
            qos: 0,
            retain: false
        };
    
        var client = mqtt.connect(config.mqtt.uri, config.mqtt.options)
    
        // MQTT Connection
        client.on('connect', function () {
            _mqttLog("[connected to broker]", 'log');
            client.subscribe(config.root + "/" + options.locationid + "/" + options.platformid + "/+/+/+");
        });
    
        // On message received on node	
        client.on('message', function (topic, message) {
            var topics = topic.split('/');
            var command = JSON.parse(message.toString());
            _mqttLog("[command received]", 'log', util.inspect({ driver: topics[3], home: topics[4], node: topics[5] }), util.inspect(command));
            invoke({ [IOPA.Path]: topic, [IOPA.Body]: message }, function(){ return Promise.resolve(true); });
        });
    
        for (var r in rejectEvents) {
            if (rejectEvents.hasOwnProperty(r)) {
                var lg = r;
                var logEvent = rejectEvents[r];
                client.on(r, function (arguments) {
                    _mqttLog(lg, logEvent, arguments);
                });
            }
        }
    
        return {
            "publish": function (topic, payload) { client.publish(topic, payload) },
            "onmessage": function (_onmessage) { invoke = _onmessage; },
            "end": function (cb) {
                var topic = config.root + "/" + options.locationid + "/" + options.platformid + "/" + "offline";
                var payload = 'connection closed';
    
                client.publish(topic, payload);
                client.end(cb);
            }
        };
    };
    
    function _mqttLog(event, logLevel, ...args) {
        var args = args.filter(function (n) { return n != undefined });
    
        if (args.length > 0) {
            console[logLevel]('[MQTT] ' + event + ' ' + args.join(', '));
        } else {
            console[logLevel]('[MQTT] ' + event);
        }
    
    }

ZwaveMQTTMiddleware.prototype.invoke = function (context, next) {
    var response = context[ZWAVE.RawPayload];


    context[ZWAVE.FrameType] = response[0];
    context[ZWAVE.Length] = response[1];
    context[ZWAVE.MessageType] = response[2];
    context[ZWAVE.SerialFunctionClass] = response[3];
    context[ZWAVE.SerialPayload] = response.slice(4, response[1] + 1);

    return Promise.resolve(null);
}

ZwaveMQTTMiddleware.prototype.send = function (server, next, context) {

    if (typeof context !== 'object' || !(ZWAVE.SerialFunctionClass in context))
        return next(context);

    var rawpayload = BufferStream.alloc("Serial Framer Send");
    rawpayload.writeARRAY([
        ZWAVE.SERIAL.SerialFrameType.SOF,
        context[ZWAVE.SerialPayload].length + 3,
        ZWAVE.SERIAL.SerialMessageType.Request,
        context[ZWAVE.SerialFunctionClass],
        ...context[ZWAVE.SerialPayload], 0x00])
    rawpayload = rawpayload.asBuffer();

    if (rawpayload.length > 1)
        rawpayload[rawpayload.length - 1] = ZWAVE.SERIAL.generateChecksum(rawpayload);

    context[ZWAVE.RawPayload] = rawpayload;

    return next(context);

}