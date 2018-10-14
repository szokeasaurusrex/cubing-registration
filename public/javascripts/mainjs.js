'use strict';

let completed = false
const fadeSpeed = 300;

function errorPage (err) {
  completed = true
  $('.page').hide()
  $('#errorMessage').text(err.message)
  $('#error').fadeIn(fadeSpeed)
  console.error(err)
}

async function post(url, data, returnJSON = false) {
  // Posts data (an object) in JSON format to URL and returns JSON or text
  let response = await fetch (url, {
    method: "post",
    headers: {
      "Content-type": "application/json; charset=UTF-8"
    },
    body: JSON.stringify(data)
  })
  if (!response.ok) {
    throw response
  }
  if (returnJSON === true) {
    return response.json()
  } else {
    return response.text()
  }
}

function makeConfirmTableRow(item, quantity, unitPrice) {
  if (quantity > 0) {
    let priceLine = ''
    if (quantity == 1) {
      priceLine = `$${unitPrice}.00`
    } else {
      priceLine = `$${unitPrice * quantity}.00 ($${unitPrice}.00 each)`
    }
    let tableRow = `
      <tr>
        <td>${item}</td>
        <td>${quantity}</td>
        <td>${priceLine}</td>
      </tr>`
    return tableRow
  } else {
    return ''
  }
}

async function submitPayment(token) {
  try {
    $('.page').hide()
    $('#loader').fadeIn(fadeSpeed)

    let regInfo = $('form').serializeObject()
    regInfo.totalPrice = $('#totalPrice').text()
    let data = {
      regInfo: regInfo,
      token: token
    }
    let response = await post('/submit/charge', data, true)
    completed = true
    if (response.status == 'success') {
      $('.page').hide()
      $('#submitted').fadeIn(fadeSpeed)
    } else if (response.status == 'card_error') {
      $('.page').hide()
      $('#confirmPage').fadeIn(fadeSpeed)
      setTimeout( () => {
        alert('Error processing payment: ' + response.message)
      }, fadeSpeed)
    } else {
      throw new Error(response.error)
    }
  } catch (err) {
    errorPage(err)
    $('#paymentResubmitWarning').show()
  }
}

$(document).ready(() => {
  $('#incompatibilityNotice').hide()
  $('#competitorInfoPage').show()
  $('#competitorInfoForm').on('submit', async event => {
    try {
      event.preventDefault()
      $('.page').hide()
      $('#loader').fadeIn(fadeSpeed)
      let data = $('form').serializeObject()
      let response = await post("/submit/competitorInfo", data)
      $('.page').hide()
      if (response == 'registered') {
        $('#alreadyRegisteredPage').fadeIn(fadeSpeed)
        completed = true
        $('form').trigger('reset')
      } else if (response == 'not registered') {
        $('#lunchPage').fadeIn(fadeSpeed)
      } else {
        throw new Error(response)
      }
    } catch (err) {
      errorPage(err)
    }
  })

  $('#lunchForm').on('submit', event => {
    event.preventDefault()
    $('.page').hide()
    $('#tshirtPage').fadeIn(fadeSpeed)
  })

  $('#lunchBack').click( () => {
    $('.page').hide()
    $('#competitorInfoPage').fadeIn(fadeSpeed)
  })

  $('#tshirtForm').on('submit', event => {
    const fullPriceRegistration = 5
    const normalLunchUnitPrice = 3
    const largeLunchUnitPrice = 5
    const tshirtUnitPrice = 18

    let totalPrice = 0
    let form = $('form').serializeObject()
    event.preventDefault()

    // Load confirm page
    $('.page').hide()
    $('#confirmPage').fadeIn(fadeSpeed)

    // Competitor info
    $('#nameConfirmation').text(form.name)
    $('#emailConfirmation').text(form.email)

    // Clear table
    $('#confirmTableBody').html('')

    // Registration fee
    if (form.isShakerStudent == 'true') {
      $('#confirmTableBody').append(makeConfirmTableRow(
        "Shaker student registration", 1, 0
      ))
    } else {
      totalPrice += 5
      $('#confirmTableBody').append(makeConfirmTableRow(
        "Full price registration", 1, fullPriceRegistration
      ))
    }

    // Normal lunch
    let normalLunchQunatity = form.normalLunch
    totalPrice += normalLunchQunatity * normalLunchUnitPrice
    $('#confirmTableBody').append(makeConfirmTableRow(
      'Normal lunch', normalLunchQunatity, normalLunchUnitPrice
    ))

    // Large lunch
    let largeLunchQunatity = form.largeLunch
    totalPrice += largeLunchQunatity * largeLunchUnitPrice
    $('#confirmTableBody').append(makeConfirmTableRow(
      'Large lunch', largeLunchQunatity, largeLunchUnitPrice
    ))

    // T-shirt
    let tshirtType = form.tshirt
    if (tshirtType != "-") {
      totalPrice += tshirtUnitPrice
      $('#confirmTableBody').append(makeConfirmTableRow(
        `Official t-shirt, size ${tshirtType}`, 1, tshirtUnitPrice
      ))
    }

    // Total Price
    $('#totalPrice').text(totalPrice)
    $
    if (totalPrice > 0) {
      $('#paymentSection').show()
      $('#noPaymentConfirmSection').hide()
    } else {
      $('#paymentSection').hide()
      $('#noPaymentConfirmSection').show()
    }

  })

  $('#tshirtBack').click( () => {
    $('.page').hide()
    $('#lunchPage').fadeIn(fadeSpeed)
  })

  $('#confirmBack').click( () => {
    $('.page').hide()
    $('#tshirtPage').fadeIn(fadeSpeed)
  })

  $('#alreadyRegisteredBack').click( () => {
    completed = false
    $('.page').hide()
    $('#competitorInfoPage').fadeIn(fadeSpeed)
  })

  $('#stripeCheckout').click( () => {
    let checkoutHandler = StripeCheckout.configure({
      key: $('#stripeKey').text(),
      locale: "auto"
    });
    checkoutHandler.open({
      name: 'Shaker Fall 2018',
      description: 'Registration fee and pre-orders',
      zipCode: true,
      billingAddress: true,
      amount: $('#totalPrice').text() * 100,
      currency: 'USD',
      email: $('form').serializeObject().email,
      token: submitPayment
    })
    // submitPayment({token: "test-token"})
  })

  $('#noPaymentConfirmButton').click( () => {
    submitPayment({})
  })

  $(window).on('beforeunload', () => {
    if (completed) {
      return;
    } else {
      return 'Changes to the form are not saved yet!';
    }
  })
})
