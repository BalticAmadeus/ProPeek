export const testData = {
    "moduleDetails": [
        {
            "moduleID": 0,
            "moduleName": "Session",
            "startLineNum": 0,
            "timesCalled": 1,
            "avgTimePerCall": 0,
            "totalTime": 0,
            "pcntOfSession": 0,
            "listingFile": "",
            "hasLink": false
        },
        {
            "moduleID": 8,
            "moduleName": "GET_SAME_CHAR test.p",
            "startLineNum": 32,
            "timesCalled": 1,
            "totalTime": 0.000016,
            "listingFile": "",
            "hasLink": true,
            "avgTimePerCall": 0.000016,
            "pcntOfSession": 0.0542
        },
        {
            "moduleID": 9,
            "moduleName": "get_same_char2 test.p",
            "startLineNum": 5,
            "timesCalled": 1,
            "totalTime": 0.00001,
            "listingFile": "",
            "hasLink": true,
            "avgTimePerCall": 0.00001,
            "pcntOfSession": 0.0339
        },
        {
            "moduleID": 2,
            "moduleName": "test.p",
            "startLineNum": 0,
            "timesCalled": 1,
            "totalTime": 0.02537,
            "listingFile": "",
            "hasLink": true,
            "avgTimePerCall": 0.02537,
            "pcntOfSession": 85.9214
        },
        {
            "moduleID": 1,
            "moduleName": "profile.p",
            "startLineNum": 0,
            "timesCalled": 1,
            "totalTime": 0.003906,
            "listingFile": "",
            "hasLink": true,
            "avgTimePerCall": 0.003906,
            "pcntOfSession": 13.2286
        },
        {
            "moduleID": 5,
            "moduleName": "test1 test1",
            "startLineNum": 5,
            "timesCalled": 1,
            "totalTime": 0.000026,
            "listingFile": "",
            "hasLink": true,
            "avgTimePerCall": 0.000026,
            "pcntOfSession": 0.0881
        },
        {
            "moduleID": 4,
            "moduleName": "test1",
            "startLineNum": 0,
            "timesCalled": 1,
            "totalTime": 0.000063,
            "listingFile": "",
            "hasLink": true,
            "avgTimePerCall": 0.000063,
            "pcntOfSession": 0.2134
        },
        {
            "moduleID": 6,
            "moduleName": "test2 under.test2 test1",
            "startLineNum": 0,
            "timesCalled": 1,
            "totalTime": 0.000001,
            "listingFile": "",
            "hasLink": true,
            "avgTimePerCall": 0.000001,
            "pcntOfSession": 0.0034
        },
        {
            "moduleID": 7,
            "moduleName": "get1 under.test2 test1",
            "startLineNum": 2,
            "timesCalled": 1,
            "totalTime": 0.000004,
            "listingFile": "",
            "hasLink": true,
            "avgTimePerCall": 0.000004,
            "pcntOfSession": 0.0135
        },
        {
            "moduleID": 3,
            "moduleName": "under.test2",
            "startLineNum": 0,
            "timesCalled": 1,
            "totalTime": 0.000131,
            "listingFile": "",
            "hasLink": true,
            "avgTimePerCall": 0.000131,
            "pcntOfSession": 0.4437
        }
    ],
    "calledModules": [
        {
            "callerID": 2,
            "calleeID": 9,
            "callerModuleName": "test.p",
            "calleeModuleName": "get_same_char2 test.p",
            "timesCalled": 1,
            "calleeTotalTimesCalled": 1,
            "callerPcntOfSession": 85.9214,
            "calleePcntOfSession": 0.0339
        },
        {
            "callerID": 2,
            "calleeID": 7,
            "callerModuleName": "test.p",
            "calleeModuleName": "get1 under.test2 test1",
            "timesCalled": 1,
            "calleeTotalTimesCalled": 1,
            "callerPcntOfSession": 85.9214,
            "calleePcntOfSession": 0.0135
        },
        {
            "callerID": 2,
            "calleeID": 8,
            "callerModuleName": "test.p",
            "calleeModuleName": "GET_SAME_CHAR test.p",
            "timesCalled": 1,
            "calleeTotalTimesCalled": 1,
            "callerPcntOfSession": 85.9214,
            "calleePcntOfSession": 0.0542
        },
        {
            "callerID": 2,
            "calleeID": 5,
            "callerModuleName": "test.p",
            "calleeModuleName": "test1 test1",
            "timesCalled": 1,
            "calleeTotalTimesCalled": 1,
            "callerPcntOfSession": 85.9214,
            "calleePcntOfSession": 0.0881
        },
        {
            "callerID": 2,
            "calleeID": 4,
            "callerModuleName": "test.p",
            "calleeModuleName": "test1",
            "timesCalled": 1,
            "calleeTotalTimesCalled": 1,
            "callerPcntOfSession": 85.9214,
            "calleePcntOfSession": 0.2134
        },
        {
            "callerID": 2,
            "calleeID": 3,
            "callerModuleName": "test.p",
            "calleeModuleName": "under.test2",
            "timesCalled": 1,
            "calleeTotalTimesCalled": 1,
            "callerPcntOfSession": 85.9214,
            "calleePcntOfSession": 0.4437
        },
        {
            "callerID": 1,
            "calleeID": 2,
            "callerModuleName": "profile.p",
            "calleeModuleName": "test.p",
            "timesCalled": 1,
            "calleeTotalTimesCalled": 1,
            "callerPcntOfSession": 13.2286,
            "calleePcntOfSession": 85.9214
        },
        {
            "callerID": 5,
            "calleeID": 6,
            "callerModuleName": "test1 test1",
            "calleeModuleName": "test2 under.test2 test1",
            "timesCalled": 1,
            "calleeTotalTimesCalled": 1,
            "callerPcntOfSession": 0.0881,
            "calleePcntOfSession": 0.0034
        }
    ],
    "lineSummary": [
        {
            "moduleID": 8,
            "lineNumber": 0,
            "timesCalled": 1,
            "avgTime": 0.000013,
            "totalTime": 0.000013,
            "hasLink": true
        },
        {
            "moduleID": 8,
            "lineNumber": 35,
            "timesCalled": 1,
            "avgTime": 0.000001,
            "totalTime": 0.000001,
            "hasLink": true
        },
        {
            "moduleID": 8,
            "lineNumber": 33,
            "timesCalled": 1,
            "avgTime": 0.000002,
            "totalTime": 0.000002,
            "hasLink": true
        },
        {
            "moduleID": 8,
            "lineNumber": 34,
            "timesCalled": 1,
            "avgTime": 0,
            "totalTime": 0,
            "hasLink": true
        },
        {
            "moduleID": 9,
            "lineNumber": 0,
            "timesCalled": 1,
            "avgTime": 0.000007,
            "totalTime": 0.000007,
            "hasLink": true
        },
        {
            "moduleID": 9,
            "lineNumber": 6,
            "timesCalled": 1,
            "avgTime": 0.000001,
            "totalTime": 0.000001,
            "hasLink": true
        },
        {
            "moduleID": 9,
            "lineNumber": 7,
            "timesCalled": 1,
            "avgTime": 0.000001,
            "totalTime": 0.000001,
            "hasLink": true
        },
        {
            "moduleID": 9,
            "lineNumber": 8,
            "timesCalled": 1,
            "avgTime": 0.000001,
            "totalTime": 0.000001,
            "hasLink": true
        },
        {
            "moduleID": 2,
            "lineNumber": 0,
            "timesCalled": 1,
            "avgTime": 0.00014,
            "totalTime": 0.00014,
            "hasLink": true
        },
        {
            "moduleID": 2,
            "lineNumber": 40,
            "timesCalled": 2,
            "avgTime": 0.004613,
            "totalTime": 0.009226,
            "hasLink": true
        },
        {
            "moduleID": 2,
            "lineNumber": 15,
            "timesCalled": 1,
            "avgTime": 0.000009,
            "totalTime": 0.000009,
            "hasLink": true
        },
        {
            "moduleID": 2,
            "lineNumber": 11,
            "timesCalled": 1,
            "avgTime": 0.009174,
            "totalTime": 0.009174,
            "hasLink": true
        },
        {
            "moduleID": 2,
            "lineNumber": 38,
            "timesCalled": 1,
            "avgTime": 0.000707,
            "totalTime": 0.000707,
            "hasLink": true
        },
        {
            "moduleID": 2,
            "lineNumber": 14,
            "timesCalled": 1,
            "avgTime": 0.006114,
            "totalTime": 0.006114,
            "hasLink": true
        },
        {
            "moduleID": 1,
            "lineNumber": 6,
            "timesCalled": 1,
            "avgTime": 0.000003,
            "totalTime": 0.000003,
            "hasLink": true
        },
        {
            "moduleID": 1,
            "lineNumber": -2,
            "timesCalled": 1,
            "avgTime": 0.000036,
            "totalTime": 0.000036,
            "hasLink": true
        },
        {
            "moduleID": 1,
            "lineNumber": 8,
            "timesCalled": 1,
            "avgTime": 0.003867,
            "totalTime": 0.003867,
            "hasLink": true
        },
        {
            "moduleID": 5,
            "lineNumber": 0,
            "timesCalled": 1,
            "avgTime": 0.000026,
            "totalTime": 0.000026,
            "hasLink": true
        },
        {
            "moduleID": 4,
            "lineNumber": 0,
            "timesCalled": 1,
            "avgTime": 0.000063,
            "totalTime": 0.000063,
            "hasLink": true
        },
        {
            "moduleID": 6,
            "lineNumber": 0,
            "timesCalled": 1,
            "avgTime": 0.000001,
            "totalTime": 0.000001,
            "hasLink": true
        },
        {
            "moduleID": 7,
            "lineNumber": 0,
            "timesCalled": 1,
            "avgTime": 0.000003,
            "totalTime": 0.000003,
            "hasLink": true
        },
        {
            "moduleID": 7,
            "lineNumber": 3,
            "timesCalled": 1,
            "avgTime": 0.000001,
            "totalTime": 0.000001,
            "hasLink": true
        },
        {
            "moduleID": 7,
            "lineNumber": 4,
            "timesCalled": 1,
            "avgTime": 0,
            "totalTime": 0,
            "hasLink": true
        },
        {
            "moduleID": 3,
            "lineNumber": 0,
            "timesCalled": 1,
            "avgTime": 0.000131,
            "totalTime": 0.000131,
            "hasLink": true
        }
    ],
    "callTree": [
        {
            "nodeID": 1,
            "parentID": 0,
            "moduleID": 1,
            "moduleName": "profile.p",
            "lineNum": 0,
            "numCalls": 1,
            "cumulativeTime": 0.029527,
            "pcntOfSession": 100
        },
        {
            "nodeID": 2,
            "parentID": 1,
            "moduleID": 2,
            "moduleName": "test.p",
            "lineNum": 8,
            "numCalls": 1,
            "cumulativeTime": 0.025621,
            "pcntOfSession": 86.7714
        },
        {
            "nodeID": 3,
            "parentID": 2,
            "moduleID": 3,
            "moduleName": "under.test2",
            "lineNum": 14,
            "numCalls": 1,
            "cumulativeTime": 0.000131,
            "pcntOfSession": 0.4437
        },
        {
            "nodeID": 4,
            "parentID": 2,
            "moduleID": 4,
            "moduleName": "test1",
            "lineNum": 14,
            "numCalls": 1,
            "cumulativeTime": 0.000063,
            "pcntOfSession": 0.2134
        },
        {
            "nodeID": 5,
            "parentID": 2,
            "moduleID": 5,
            "moduleName": "test1 test1",
            "lineNum": 14,
            "numCalls": 1,
            "cumulativeTime": 0.000027,
            "pcntOfSession": 0.0914
        },
        {
            "nodeID": 6,
            "parentID": 5,
            "moduleID": 6,
            "moduleName": "test2 under.test2 test1",
            "lineNum": 0,
            "numCalls": 1,
            "cumulativeTime": 0.000001,
            "pcntOfSession": 0.0034
        },
        {
            "nodeID": 7,
            "parentID": 2,
            "moduleID": 7,
            "moduleName": "get1 under.test2 test1",
            "lineNum": 15,
            "numCalls": 1,
            "cumulativeTime": 0.000004,
            "pcntOfSession": 0.0135
        },
        {
            "nodeID": 8,
            "parentID": 2,
            "moduleID": 8,
            "moduleName": "GET_SAME_CHAR test.p",
            "lineNum": 38,
            "numCalls": 1,
            "cumulativeTime": 0.000016,
            "pcntOfSession": 0.0542
        },
        {
            "nodeID": 9,
            "parentID": 2,
            "moduleID": 9,
            "moduleName": "get_same_char2 test.p",
            "lineNum": 40,
            "numCalls": 1,
            "cumulativeTime": 0.00001,
            "pcntOfSession": 0.0339
        }
    ],
    "hasTracingData": false,
    "hasXREFs": false,
    "hasListings": false
}