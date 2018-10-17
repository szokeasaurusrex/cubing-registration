'use strict';

let completed = true
const fadeSpeed = 300;

function errorPage (err) {
  completed = true
  window.scrollTo(0, 0)
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
    window.scrollTo(0, 0)
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
      window.scrollTo(0, 0)
      $('.page').hide()
      $('#submitted').fadeIn(fadeSpeed)
    } else if (response.status == 'card_error') {
      window.scrollTo(0, 0)
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
  $('#introPage').fadeIn(fadeSpeed)

  $('#completeRegistrationButton').click( () => {
    $('.page').hide()
    $('#competitorInfoPage').fadeIn(fadeSpeed)
    $('#competitorInfoForm').on('submit', async event => {
      try {
        event.preventDefault()
        window.scrollTo(0, 0)
        $('.page').hide()
        $('#loader').fadeIn(fadeSpeed)
        let data = $('form').serializeObject()
        let response = await post("/submit/competitorInfo", data)
        $('.page').hide()
        window.scrollTo(0, 0)
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
  })

  $('#competitorInfoBack').click( () => {
    $('.page').hide()
    $('#introPage').fadeIn(fadeSpeed)
  })

  $('#lunchForm').on('submit', event => {
    event.preventDefault()
    window.scrollTo(0, 0)
    $('.page').hide()
    $('#tshirtPage').fadeIn(fadeSpeed)
  })

  $('#lunchBack').click( () => {
    window.scrollTo(0, 0)
    $('.page').hide()
    $('#competitorInfoPage').fadeIn(fadeSpeed)
  })

  $('#tshirtForm').on('submit', event => {
    const fullPriceRegistration = 5
    const normalLunchUnitPrice = 5
    const smallLunchUnitPrice = 3
    const tshirtUnitPrice = 18

    let totalPrice = 0
    let form = $('form').serializeObject()
    event.preventDefault()

    // Load confirm page
    window.scrollTo(0, 0)
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

    // Small lunch
    let smallLunchQunatity = form.smallLunch
    totalPrice += smallLunchQunatity * smallLunchUnitPrice
    $('#confirmTableBody').append(makeConfirmTableRow(
      'Small lunch', smallLunchQunatity, smallLunchUnitPrice
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
    window.scrollTo(0, 0)
    $('.page').hide()
    $('#lunchPage').fadeIn(fadeSpeed)
  })

  $('#confirmBack').click( () => {
    window.scrollTo(0, 0)
    $('.page').hide()
    $('#tshirtPage').fadeIn(fadeSpeed)
  })

  $('#alreadyRegisteredBack').click( () => {
    completed = false
    window.scrollTo(0, 0)
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
