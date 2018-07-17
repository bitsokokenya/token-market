
function doNewTransfer() {

    $(".tradeOrderSubTitle").html('New Transfer');
    $(".tradeOrderBody").html('transfer ' + allTokens[activeCoin.toLowerCase()].name + ' tokens to a different address');
    $(".tradeOrderImg").prop("src", '/bitsAssets/images/currencies/' + allTokens[activeCoin.toLowerCase()].name + '.png');

    $("#newTransferAmount").attr("placeholder", 'Max: ' + ((allTokens[activeCoin.toLowerCase()].balance / Math.pow(10, allTokens[activeCoin.toLowerCase()].decimals)) * (allTokens[activeCoin.toLowerCase()].rate * baseX)).toFixed(2) + ' ' + baseCd);
    $("#newTransferAmount").attr("max", ((allTokens[activeCoin.toLowerCase()].balance / Math.pow(10, allTokens[activeCoin.toLowerCase()].decimals)) * (allTokens[activeCoin.toLowerCase()].rate * baseX)));



    $("#newTransferConfirmation,#newTransferAmount").change(function () {

        if (web3.isAddress($("#newTransferConfirmation").val()) && $('.newTransferForm')[0].checkValidity()) {

            $(".tradeOrderFooterComplete").attr("disabled", false);
        } else {

            $(".tradeOrderFooterComplete").attr("disabled", true);
        }

    });


    //New Transfer Input Count
    //    document.querySelector("#newTransferConfirmation").addEventListener("pointerup", function(e){
    //        var inputCount = $("#newTransferConfirmation").val().length
    //        if ($("#newTransferConfirmation").val().length > 2) {
    //            doFetch({
    //                action: 'matchTrader'
    //            }).then(function (e) {
    //                if (e.status == 'ok') {
    //                    console.log(e)
    //                } else {
    //
    //                }
    //            });
    //        }
    //    });
    //    $("#newTransferConfirmation").keyup(function () {
    //        
    //    });

}
