﻿/// <reference path="https://ajax.googleapis.com/ajax/libs/ext-core/3.1.0/ext-core.js" include="false" />
/// <reference path="kkj.evt.js" />
/// <reference path="kkj.data.js" />

module("kkj.data");

test("YqlMerge: serviceUrl", function () {

    // Fixture setup ...
    var url = kkj.data.YqlMerge._serviceUrl;

    // Verify SUT ...
    ok(Ext.isString(url));
});

test("YqlMerge: url", function () {

    // Fixture setup ...
    var query = " ";
    var callback = "callback";

    // Exercise SUT ...
    var url = kkj.data.YqlMerge.url(query, callback);

    // Verify SUT ...
    ok(Ext.isString(url));
    notStrictEqual(url.indexOf("?q=%20&"), -1);
    var queryPart = url.substring(url.indexOf("?") + 1);
    var params = Ext.urlDecode(queryPart);
    strictEqual(params.q, query);
    strictEqual(params.format, "json");
    strictEqual(params.callback, callback);
});

test("YqlMerge: _callbackName", function () {

    // Fixture setup ...
    var source = "twitter";

    // Exercise SUT ...
    var callback = kkj.data.YqlMerge._callbackName(source);

    // Verify SUT ...
    strictEqual(callback, source + "Callback");
});

var baseContext = Ext.apply(
    {},
    { 
        window: {
            document: {
                createElement: function () { return {}; },
                body: { appendChild: function () { } }
            }
        } 
    },
    kkj.data.YqlMerge
);

test("YqlMerge: _fetch: calls _callbackName", function () {

    // Fixture setup ...
    var spec = { source: "foo" };
    var _callbackNameCalled = false;
    var context = Ext.apply(
        {},
        {
            _callbackName: function (source) {
                _callbackNameCalled = true;
                strictEqual(source, spec.source);
            }
        },
        baseContext
    );

    // Exercise SUT ...
    kkj.data.YqlMerge._fetch.call(context, spec);

    // Verify SUT ...
    ok(_callbackNameCalled);
});

test("YqlMerge: _fetch: calls url", function () {

    // Fixture setup ...
    var spec = {
        source: "foo",
        query: "select * from foo"
    };
    var urlCalled = false;
    var context = Ext.apply(
        {},
        {
            url: function (query, callback) {
                urlCalled = true;
                strictEqual(query, spec.query);
                strictEqual(callback, kkj.data.YqlMerge._callbackName(spec.source));
            }
        },
        baseContext
    );

    // Exercise SUT ...
    kkj.data.YqlMerge._fetch.call(context, spec);

    // Verify SUT ...
    ok(urlCalled);
});

test("YqlMerge: _fetch: adds callback, callback deletes win ref", function () {

    // Fixture setup ...
    var spec = {
        source: "foo",
        query: "select * from foo",
        data: function () { }
    };
    var context = Ext.apply({}, baseContext);

    // Exercise SUT ...
    kkj.data.YqlMerge._fetch.call(context, spec, { done: function () { } });

    // Verify SUT ...
    var callbackName = kkj.data.YqlMerge._callbackName(spec.source);
    ok(typeof context.window[callbackName] === "function");
    context.window[callbackName]();
    ok(typeof context.window[callbackName] === "undefined");
});

test("YqlMerge: _fetch: creates and appends script element", function () {

    // Fixture setup ...
    var spec = {
        source: "foo",
        query: "select * from foo"
    };
    var createElementCalled = false;
    var appendChildCalled = false;
    var element = {};
    var context = Ext.apply(
        {},
        {
            window: {
                document: {
                    createElement: function (nodeName) {
                        createElementCalled = true;
                        strictEqual(nodeName, "script");
                        return element;
                    },
                    body: {
                        appendChild: function (actualElement) {                                
                            appendChildCalled = true;
                            strictEqual(actualElement, element);
                        }
                    }
                }
            }
        },
        baseContext
    );

    // Exercise SUT ...
    kkj.data.YqlMerge._fetch.call(context, spec);

    // Verify SUT ...
    ok(createElementCalled);
    var src = kkj.data.YqlMerge.url(spec.query, kkj.data.YqlMerge._callbackName(spec.source));
    strictEqual(element.src, src);
    ok(appendChildCalled);
});

test("YqlMerge: _fetch: calls session done with fixed data", function () {

    // Fixture setup ...
    var dataCalled = false;
    var fixedData = [ "foo" ];
    var spec = {
        source: "foo",
        query: "select * from foo",
        data: function (data) {
            dataCalled = true;
            return fixedData;
        }
    };
    var doneCalled = false;
    var data = [ "foo", "bar" ];
    var session = {
        done: function (actualFixedData) {
            doneCalled = true;
            strictEqual(actualFixedData, fixedData);
        }
    };
    var context = Ext.apply({}, baseContext);

    // Exercise SUT ...
    kkj.data.YqlMerge._fetch.call(context, spec, session)();

    // Verify SUT ...
    ok(dataCalled);
    ok(doneCalled);
});

test("YqlMerge: merge: calls _fetch with query and session", function () {

    // Fixture setup ...
    var query = { foo: "bar" };
    var queries = [ query ];
    var _fetchCalled = false;
    var data = [ "foo", "bar" ];
    var context = Ext.apply(
        {},
        {
            _fetch: function (actualQuery, session) {
                _fetchCalled = true;
                strictEqual(actualQuery, query);
                strictEqual(session._numFetched, 0);
                strictEqual(typeof session.done, "function");
                session.done(data);
                strictEqual(session._numFetched, 1);
            }
        },
        baseContext
    );
    var callbackCalled = false;
    var callback = function (actualData) {
        callbackCalled = true;
        deepEqual(actualData, data);
    };

    // Exercise SUT ...
    kkj.data.YqlMerge.merge.call(context, queries).then(callback);

    // Verify SUT ...
    ok(_fetchCalled);
    ok(callbackCalled);
});

test("YqlMerge: _assertSchemaValid: schema undefined/null/not object, error", function () {

    // Exercise and verify SUT ...
});