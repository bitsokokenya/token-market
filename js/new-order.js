var x = document.querySelectorAll('.newTrade');
var i;
for (i = 0; i < x.length; i++) {
    x[i].addEventListener("input", function () {

        updateNewOrderDet($('.tradeOrderFooterComplete').attr("oid"), $('.tradeOrderFooterComplete').attr("action"));

    });
}



function updateNewOrderDet(oid, action) {
    if($('.tradeOrderFooterComplete').attr("action")=='transfer'){
    return;
    }
    if (activeCoin.endsWith("s")) {
        var sss = '';
    } else {
        var sss = 's';
    }
    
   
        $(".newTradeForm").css("display", 'block');
    

    if (parseFloat(($("#newTradePrice").val()) * parseFloat($("#newTradeAmount").val())) > 0 && $('.newTradeForm')[0].checkValidity()) {

        $(".tradeOrderFooterComplete").attr("disabled", false);


    } else {

        $(".tradeOrderFooterComplete").attr("disabled", true);
    }


    var orderPrice = parseFloat($("#newTradePrice").val());
    var orderAmount = parseFloat($("#newTradeAmount").val());
    var orderTotal = parseFloat($("#newTradeTotal").val());


    console.log("!!!!!!!!!!!!!!!!!!!", orderPrice);

    if (orderPrice == NaN) {
        var orderPrice = allTokens[activeCoin].rate * baseX;
    }

    var stepVal = (orderPrice / Math.pow(10, allTokens[activeCoin].decimals)).toFixed(allTokens[activeCoin].decimals);




    $("#newTradeTotal").attr("step", stepVal);


    if (orderTotal == NaN || $("#newTradeTotal").val() == "") {
        var orderTotal = 0;
    }
    if (orderPrice == NaN || $("#newTradePrice").val() == "") {
        var orderPrice = 0;
    }
    if (orderAmount == NaN || $("#newTradeAmount").val() == "") {
        var orderAmount = 0;
    }

    var res = orderTotal / orderPrice;
    var ress = orderTotal / orderAmount;
    try {

        var ntt = numberify(orderTotal.toFixed(2))

    } catch (er) {

        var ntt = 0
    }

    if (action == 'buy') {
        $("#newTradeTotal").attr("placeholder", 'eg: '+ ((((allTokens[activeCoin].balance / Math.pow(10, allTokens[activeCoin].decimals)) * 0.9) * orderPrice)/2).toFixed(2) +' '+ baseCd.toUpperCase());
        $("#newTradeTotal").attr("max", (((allTokens[activeCoin].balance / Math.pow(10, allTokens[activeCoin].decimals)) * 0.9) * orderPrice));
        $("#newTradeTotal").attr("min", 100*baseConv);

       
        $(".tradeOrderSubTitle").html('NEW BUY ORDER: ' + ntt + ' ' + baseCd.toUpperCase());
        $(".tradeOrderBody").html('you will recieve ' + res.toFixed(allTokens[activeCoin].decimals) + ' ' + (allTokens[activeCoin.toLowerCase()].name + sss).toUpperCase());
        $(".tradeOrderImg").prop("src", '/bitsAssets/images/currencies/' + allTokens[activeCoin].name + '.png')
    } else if (action == 'sell') {

        $("#newTradeTotal").attr("placeholder", 'Max: ' + ((((allTokens[activeCoin].balance / Math.pow(10, allTokens[activeCoin].decimals)) * 0.9) / 2) * orderPrice).toFixed(2) + ' ' + baseCd.toUpperCase());
        $("#newTradeTotal").attr("max", (((allTokens[activeCoin].balance / Math.pow(10, allTokens[activeCoin].decimals)) * 0.9) / 2) * orderPrice);
        $("#newTradeTotal").attr("min", 100*baseConv);

        $(".tradeOrderSubTitle").html('NEW SELL ORDER: ' + ntt + ' ' + baseCd.toUpperCase());
        $(".tradeOrderBody").html('you will send ' + res.toFixed(allTokens[activeCoin].decimals) + ' ' + (allTokens[activeCoin.toLowerCase()].name + sss).toUpperCase());
    $(".tradeOrderImg").prop("src", '/bitsAssets/images/currencies/' + allTokens[activeCoin].name + '.png')
    }

  
        $("#newTradeAmount").val(res.toFixed(allTokens[activeCoin].decimals));

        $(".transStat").html('placing new order..');


    $(".tradeOrderTitle").html('');
    $(".completeOrderBut").prop("oid", '');
  //  setOrderCallbacks();

}


