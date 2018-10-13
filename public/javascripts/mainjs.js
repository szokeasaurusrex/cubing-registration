'use strict';

let completed = false

function errorPage (err) {
  completed = true
  $('.page').hide()
  $('#errorMessage').text(err.message)
  $('#error').fadeIn(fadeSpeed)
}

async function post(url, data, returnText = false) {
  // Posts data (an object) in JSON format to URL and returns JSON or text
  let response = await fetch (url, {
    method: "post",
    headers: {
      "Content-type": "application/json; charset=UTF-8"
    },
    body: JSON.stringify(data)
  })
  if (returnText === true) {
    return response.text()
  } else {
    return response.json()
  }
}
$(document).ready(() => {
  const fadeSpeed = 200;

  $('#incompatibilityNotice').hide()
  $('#competitorInfoPage').show()
  $('#competitorInfoForm').on('submit', async event => {
    try {
      event.preventDefault()
      $('.page').hide()
      $('#loader').fadeIn(fadeSpeed)
      let data = $('form').serializeObject()
      let response = await post("/submit/competitorInfo", data, true)
      console.log(response)
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

  $('#stripePlaceholder').click( async () => {
    try {
      $('.page').hide()
      $('#loader').fadeIn(fadeSpeed)

      let regInfo = $('form').serializeObject()
      regInfo.totalPrice = $('#totalPrice').text()
      let data = {
        regInfo: regInfo,
        payment: {token: "test token"}
      }
      let response = await post('/submit/charge', data)
      completed = true
      if (response.status == 'success') {
        $('.page').hide()
        $('#submitted').fadeIn(fadeSpeed)
      } else {
        throw new Error(response.error)
      }
    } catch (err) {
      errorPage(err)
    }
  })

  $(window).on('beforeunload', () => {
    if (completed) {
      return;
    } else {
      return 'Changes to the form are not saved yet!';
    }
  })
})


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
