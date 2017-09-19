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
    IOPA = { Scheme: "iopa.Scheme", Protocol: "iopa.Protocol" },
    MQTT = { Body: "mqtt.Body", Topic: "mqtt.Topic", Capabilities: "mqtt.Capabilities", Version: "mqtt.Version" },
    SERVER = { Capabilities: "server.Capabilities", Server: "server.Server" };

const rejectEvents = {
    'reconnect': 'info',
    'close': 'warn',
    'offline': 'warn',
    'error': 'error'
};

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/*
 * MQTT Transport Server
 * 
 * This IOPA Middleware function should be one of the first middleware to be added to the App pipeline.
 * It adds a createServer function to the app (or hooks into one if already exists) to 
 * create MQTT server objects on demand.
 * 
 * Usage: 
 *      app.use(MqttTransportServer);
 *      server = app.createServer("mqtt:");
 *      zwave = server.listen("localhost:1883");
 *      zwave.send(context);
 * 
 * One Transport Server can create multiple servers using the same pipeline 
 * 
 * @class MqttTransportServer
 * @param app  IOPA AppBuilder App
 * @constructor
 * @public
 */
function MqttTransportServer(app) {

    _classCallCheck(this, MqttTransportServer);

    this.app = app;

    const packageVersion = require('../../package.json').version;

    app.properties[SERVER.Capabilities][MQTT.Capabilities] = {};
    app.properties[SERVER.Capabilities][MQTT.Capabilities][MQTT.Version] = packageVersion;
}

module.exports = MqttTransportServer;

// PUBLIC METHODS, AUTOMATICALLY HOOKED BY AUTO GENERATED createServerForServers (see IOPA AppBuilder)

MqttTransportServer.prototype.connect = function (server, options) {

    server.url = port;
    server.options = options || {};

    var config = options.config;

    config.mqtt.options.will = {
        topic: config.root + "/" + options.locationid + "/" + options.platformid + "/" + "offline",
        payload: 'connection closed abnormally',
        qos: 0,
        retain: false
    };

    server._rawstream = mqtt.connect(config.mqtt.uri, config.mqtt.options);

    return new Promise(function (resolve, reject) {

        server._rawstream.on('connect', function () {
            _mqttLog("[connected to broker]", 'log');
            server._rawstream.subscribe(config.root + "/" + options.locationid + "/" + options.platformid + "/+/+/+");
            server.isOpen = true;
            resolve(server);
        });

        server._rawstream.on('message', this.onMessage_.bind(this, server));

        for (var r in rejectEvents) {
            if (rejectEvents.hasOwnProperty(r)) {
                var lg = r;
                var logEvent = rejectEvents[r];
                server._rawstream.on(r, function (arguments) {
                    _mqttLog(lg, logEvent, arguments);
                });
            }
        }
    });
};

ZwaveTransportServer.prototype.send = function (server, next, context) {
    if (!server.isOpen)
        throw new Error("server must be opened with listen first");

    var message = context[MQTT.Body];
    var topic = context[MQTT.Topic];

    var result = new Promise(function (resolve, reject) {
        server._rawstream.publish(topic, payload, resolve);
    });

    if ('dispose' in context) context.dispose();
    else {
        for (var prop in context) {
            if (context.hasOwnProperty(prop)) {
                if (context[prop].dispose) context[prop].dispose();

                context[prop] = null;
            }
        };
    }

    return result;
}

ZwaveTransportServer.prototype.close = function (server) {
    server.isOpen = false;
    return new Promise(function (resolve, reject) {

        var topic = config.root + "/" + options.locationid + "/" + options.platformid + "/" + "offline";
        var payload = 'connection closed';
        if (server._rawstream) {
            server._rawstream.publish(topic, payload);
            server._rawstream.end(resolve);
            server._rawstream = null;
        }
        else
            resolve();

    });
}

// PRIVATE METHODS

ZwaveTransportServer.prototype.onMessage_ = function (server, topic, message) {
    var topics = topic.split('/');
    _mqttLog("[command received]", 'log', util.inspect({ driver: topics[3], home: topics[4], node: topics[5] }));

    var context = this.app.createContext();
    context[MQTT.Body] = message;
    context[MQTT.Topic] = topic;
    context[IOPA.Scheme] = "mqtt:";
    context[IOPA.Protocol] = "MQTT/3.1.1";
    context[SERVER.Capabilities][SERVER.Server] = server;
    context.using(this.app.invoke.bind(this.app));

}

function _mqttLog(event, logLevel, ...args) {
    var args = args.filter(function (n) { return n != undefined });

    if (args.length > 0) {
        console[logLevel]('[MQTT] ' + event + ' ' + args.join(', '));
    } else {
        console[logLevel]('[MQTT] ' + event);
    }

}