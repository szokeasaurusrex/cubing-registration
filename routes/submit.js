'use strict';

const keyPublishable = process.env.PUBLISHABLE_KEY
const keySecret = process.env.SECRET_KEY
const deadline = new Date(Date.UTC(2018, 10, 21, 5))

var express = require('express')
var router = express.Router()
const stripe = require("stripe")(keySecret);

var MongoClient = require('mongodb').MongoClient
const mongoUrl = "mongodb://localhost:27017/cubing"

router.post('/competitorInfo', async (req, res) => {
  let db
  try {
    if (new Date() > deadline) {
      throw new Error('The registration deadline has passed.')
    }
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
  try {
    if (new Date() > deadline) {
      throw new Error('The registration deadline has passed.')
    }
    const possibleTshirtVals = ['S', 'M', 'L', 'XL', '-']
    let charge = {}
    let totalPrice = 0
    let requestData = req.body
    let regInfo = requestData.regInfo
    let token = requestData.token
    if (possibleTshirtVals.indexOf(regInfo.tshirt) < 0) {
      throw new Error('T-shirt value error')
    }
    if (isNaN(regInfo.largeLunch) ||
        isNaN(regInfo.smallLunch) ||
        isNaN(regInfo.totalPrice)) {
          throw new Error('Number value error')
    }
    regInfo.largeLunch = parseInt(regInfo.largeLunch)
    regInfo.smallLunch = parseInt(regInfo.smallLunch)
    regInfo.totalPrice = parseInt(regInfo.totalPrice)
    regInfo.isShakerStudent = (regInfo.isShakerStudent === "true")
    if (regInfo.isShakerStudent == false) {
      totalPrice += 5
    }
    totalPrice += 5 * regInfo.largeLunch
    totalPrice += 3 * regInfo.smallLunch
    if (regInfo.tshirt != "-") {
      totalPrice += 18
    }
    if (totalPrice == regInfo.totalPrice) {
      if (totalPrice > 0) {
        try {
          charge = await stripe.charges.create({
            amount: totalPrice * 100,
            currency: 'usd',
            source: token.id,
            description: 'Registration fee and pre-orders for Shaker Fall 2018',
            receipt_email: regInfo.email,
            metadata: regInfo
          })
          if (charge.failure_code !== null) {
            throw new Error(charge.failure_message)
          }
          regInfo.chargeId = charge.id
          regInfo.charge = charge
        } catch (err) {
          console.log(err)
          if (err.type == 'StripeCardError') {
            res.json({
              status: 'card_error',
              message: err.message
            })
            return
          } else {
            throw new Error("Error charging card. (Not user's fault)")
          }
        }
      }
      regInfo.date = new Date()
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
