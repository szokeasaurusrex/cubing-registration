var express = require('express')
var router = express.Router()

var MongoClient = require('mongodb').MongoClient
const mongoUrl = "mongodb://localhost:27017/cubing"

router.post('/competitorInfo', async (req, res) => {
  let db
  try {
    db = await MongoClient.connect(mongoUrl, {useNewUrlParser: true})
    let collection = db.db('cubing').collection('registrations')
    let query = {email: req.body.email}
    if (await collection.findOne(query) ) {
      res.send('registered')
    } else {
      res.send('not registered')
    }
    db.close()
  } catch(err) {
    res.send(err.message)
    db.close()
  }
})

// TODO: Add /initiatePayment

router.post('/charge', async (req, res) => {
  const possibleTshirtVals = ['S', 'M', 'L', 'XL', '-']
  let totalPrice = 0
  let requestData = req.body
  let regInfo = requestData.regInfo
  console.log(req.body)
  try {
    if (possibleTshirtVals.indexOf(regInfo.tshirt) < 0) {
      throw new Error('T-shirt value error')
    }
    if (isNaN(regInfo.normalLunch) ||
        isNaN(regInfo.largeLunch) ||
        isNaN(regInfo.totalPrice)) {
          throw new Error('Number value error')
    }
    regInfo.normalLunch = parseInt(regInfo.normalLunch)
    regInfo.largeLunch = parseInt(regInfo.largeLunch)
    regInfo.totalPrice = parseInt(regInfo.totalPrice)
    regInfo.isShakerStudent = (regInfo.isShakerStudent === "true")
    if (regInfo.isShakerStudent == false) {
      totalPrice += 5
    }
    totalPrice += 3 * regInfo.normalLunch
    totalPrice += 5 * regInfo.largeLunch
    if (regInfo.tshirt != "-") {
      totalPrice += 18
    }
    if (totalPrice == regInfo.totalPrice) {
      regInfo.approved = false
      let db
      try {
        db = await MongoClient.connect(mongoUrl, {useNewUrlParser: true})
        let collection = db.db('cubing').collection('registrations')
        let query = {email: regInfo.email}
        if (await collection.findOne(query)) {
          throw new Error('Email address already registered.')
        } else {
          await collection.insertOne(regInfo)
          res.json({status: 'success', dataReceived: req.body})
          db.close()
        }
      } catch(err) {
        db.close()
        throw err
      }
    } else {
      throw new Error("Price Error")
    }
  } catch (err) {
    res.json({status: 'error', error: err.message, dataReceived: req.body})
  }


})

module.exports = router
