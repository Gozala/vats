'use strict'

exports["test tabs"] = require("./tabs")
exports["test request"] = require("./request")

//if (module == require.main) 
require("test").run(exports)
