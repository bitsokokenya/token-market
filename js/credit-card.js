

/**
 * Builds PaymentRequest for credit cards, but does not show any UI yet.
 *
 * @return {PaymentRequest} The PaymentRequest oject.
 */
function initPaymentRequest(oid, amount) {
    let networks = ['amex', 'diners', 'discover', 'jcb', 'mastercard', 'unionpay',
      'visa', 'mir'];
    let types = ['debit', 'credit', 'prepaid'];
    let supportedInstruments = [{
        supportedMethods: networks,
  }, {
        supportedMethods: ['basic-card'],
        data: {
            supportedNetworks: networks,
            supportedTypes: types
        },
  }];

    let details = {
        total: {
            label: 'Total',
            amount: {
                currency: baseCd.toUpperCase(),
                value: amount
            }
        },
        displayItems: [
            {
                label: 'TID-' + oid,
                amount: {
                    currency: baseCd.toUpperCase(),
                    value: amount
                },
      },
    ],
    };

    return new PaymentRequest(supportedInstruments, details);
}

/**
 * Invokes PaymentRequest for credit cards.
 *
 * @param {PaymentRequest} request The PaymentRequest object.
 */
function onBuyClicked(request) {
    request.show().then(function (instrumentResponse) {
            sendPaymentToServer(instrumentResponse);
        })
        .catch(function (err) {
            console.log(err);

            $('#tradeOrder').modal('close');

        });
}

/**
 * Simulates processing the payment data on the server.
 *
 * @param {PaymentResponse} instrumentResponse The payment information to
 * process.
 */
function sendPaymentToServer(instrumentResponse) {
    // There's no server-side component of these samples. No transactions are
    // processed and no money exchanged hands. Instantaneous transactions are not
    // realistic. Add a 2 second delay to make it seem more real.
    window.setTimeout(function () {
        instrumentResponse.complete('success')
            .then(function () {
                document.getElementById('result').innerHTML =
                    instrumentToJsonString(instrumentResponse);
            })
            .catch(function (err) {
                console.log(err);
            });
    }, 2000);
}
/*
//Open User Account
$(document).on("click", "#topUpToken", function () {
    $("#tradeOrder").modal({
        onCloseStart: starting(),
        onCloseEnd: $("#userAccount").modal("open")
    }).modal("close")

    setTimeout(function () {
        $("#userAccount").modal("open");
    }, 2000);
})
*/
/**
 * Converts the payment instrument into a JSON string.
 *
 * @private
 * @param {PaymentResponse} instrument The instrument to convert.
 * @return {string} The JSON string representation of the instrument.
 */
function instrumentToJsonString(instrument) {
    let details = instrument.details;
    details.cardNumber = 'XXXX-XXXX-XXXX-' + details.cardNumber.substr(12);
    details.cardSecurityCode = '***';

    return JSON.stringify({
        methodName: instrument.methodName,
        details: details,
    }, undefined, 2);
}

const payButton = document.getElementById('buyTokenButton');


payButton.setAttribute('style', 'display: none;');
if (window.PaymentRequest) {
    let request;
    payButton.setAttribute('style', 'display: inline;');

    payButton.addEventListener('click', function () {
        var oid = document.querySelector('#buyTokenButton').getAttribute("oid");
        var amount = document.querySelector('#buyTokenButton').getAttribute("amount");
        request = initPaymentRequest(oid, amount);

        onBuyClicked(request);

    });
} else {
    console.log('This browser does not support web payments');
}
