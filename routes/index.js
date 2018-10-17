'use strict';

const keyPublishable = process.env.PUBLISHABLE_KEY
const deadline = new Date(Date.UTC(2018, 10, 22, 5))

var express = require('express')
var router = express.Router()

var MongoClient = require('mongodb').MongoClient
const mongoUrl = "mongodb://localhost:27017/cubing"



/* GET home page. */
router.get('/', (req, res) => {
  if (new Date() < deadline) {
    res.render('index', {
      stripeKeyPublishable: keyPublishable
    })
  } else {
    res.render('deadlinePassed')
  }
})



module.exports = router
