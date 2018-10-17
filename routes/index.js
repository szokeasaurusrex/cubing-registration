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
    let deadlineString = ''
    const displayDeadline = new Date(deadline.getTime() - 1)
    deadlineString += displayDeadline.toLocaleString('en-us', {
      timeZone: 'America/New_York',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    deadlineString += ' at '
    deadlineString += displayDeadline.toLocaleString('en-us', {
      timeZone: 'America/New_York',
      hour: 'numeric',
      minute: 'numeric',
      timeZoneName: 'short'
    })
    res.render('index', {
      stripeKeyPublishable: keyPublishable,
      deadline: deadlineString
    })
  } else {
    res.render('deadlinePassed')
  }
})



module.exports = router
