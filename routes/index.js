var express = require('express')
var router = express.Router()

var MongoClient = require('mongodb').MongoClient
const mongoUrl = "mongodb://localhost:27017/cubing"



/* GET home page. */
router.get('/', (req, res) => {
  res.render('index')
})



module.exports = router
