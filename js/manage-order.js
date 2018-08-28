function manageOrderDet(oid) {
    var store = getObjectStore('data', 'readwrite').get("market-orders");
    store.onsuccess = function (event) {

        var allOrds = JSON.parse(event.target.result);

        for (var ix in allOrds) {

            if (parseInt(allOrds[ix].id) == parseInt(oid)) {

                console.log(allOrds[ix], parseInt(oid), parseInt(localStorage.getItem('bits-user-name')));

                //account for currency conversions
                allOrds[ix].rate = JSON.stringify(parseFloat(allOrds[ix].rate) * baseConv);


                //START enable or diasble cancel button
                if (parseInt(allOrds[ix].tranFrom.uid) == parseInt(localStorage.getItem('bits-user-name')) || parseInt(allOrds[ix].tranTo.uid) == parseInt(localStorage.getItem('bits-user-name'))) {


                    if (allOrds[ix].trading == 'true') {
                        $("#newTradePrice").attr("disabled", true);
                    }

                    if (allOrds[ix].state == 'pending') {
                        $(".tradeOrderFooterCancel").html("cancel");
                        $(".tradeOrderFooterCancel").attr("action", "cancel");


                    } else {
                        $(".tradeOrderFooterCancel").html("dispute");
                        $(".tradeOrderFooterCancel").attr("action", "dispute");

                    }

                    $(".tradeOrderFooterCancel").attr("disabled", false);
                } else {


                    if (parseInt(allOrds[ix].state) == 'pending') {

                        $(".tradeOrderFooterCancel").attr("disabled", true);

                    } else {
                        $(".tradeOrderFooterCancel").html("dispute");
                        $(".tradeOrderFooterCancel").attr("action", "dispute");

                        $(".tradeOrderFooterCancel").attr("disabled", false);
                    }

                }

                //END enable or diasble cancel button


                $("#newTradePrice").val(allOrds[ix].rate);
                $("#newTradeAmount").val(allOrds[ix].amount);
                var tAmount = parseFloat((parseFloat(allOrds[ix].amount) * parseFloat(allOrds[ix].rate)).toFixed(2));
                $("#newTradeTotal").val(tAmount);
                var cardTot = tAmount + (tAmount * 0.05);


                $(".totalCardPay").html(cardTot.toFixed(2));
                document.querySelector('#buyTokenButton').setAttribute('oid', oid);
                document.querySelector('#buyTokenButton').setAttribute('amount', cardTot);



                if (parseInt(allOrds[ix].tranFrom) == 0) {

                    $(".tradeOrderSubTitle").html('SELLING ' + Math.floor10(parseFloat(allOrds[ix].amount), Math.abs(allTokens[allOrds[ix].coin].decimals) * -1) + ' ' + (allTokens[activeCoin.toLowerCase()].name).toUpperCase());
                    $(".transStat").html('confirm payment below');
                    $(".tradeOrderBody").html('Recieve ' + (parseFloat(allOrds[ix].amount) * parseFloat(allOrds[ix].rate)).toFixed(2) + ' ' +
                        baseCd.toUpperCase() + ' at phone number ' + allOrds[ix].tranTo.phone + ' then enter the transaction code below.');
                    $(".tradeOrderImg").prop("src", allOrds[ix].tranTo.icon);


                    //trade address
                    var trnadr = '0x' + JSON.parse(allOrds[ix].tranTo.address.replace('["', "['").replace('"]', "']")).publicAddress.replace("['", '').replace("']", '');
                    $('.tradeOrderFooterComplete').attr("oadr", trnadr);


                } else if (parseInt(allOrds[ix].tranTo) == 0) {
                    $(".tradeOrderSubTitle").html('BUYING ' + Math.floor10(parseFloat(allOrds[ix].amount), Math.abs(allTokens[allOrds[ix].coin].decimals) * -1) + ' ' + (allTokens[activeCoin.toLowerCase()].name).toUpperCase());
                    $(".transStat").html('waiting for you to complete transaction');
                    $(".tradeOrderBody").html('Send ' + (parseFloat(allOrds[ix].amount) * parseFloat(allOrds[ix].rate)).toFixed(2) + ' ' +
                        baseCd.toUpperCase() + ' to ' + allOrds[ix].tranFrom.name.split(" ") + ' at phone number ' + allOrds[ix].tranFrom.phone +
                        ' then enter the transaction code below.');
                    $(".tradeOrderImg").prop("src", allOrds[ix].tranFrom.icon);


                    //trade address
                    var trnadr = '0x' + JSON.parse(allOrds[ix].tranFrom.address.replace('["', "['").replace('"]', "']")).publicAddress.replace("['", '').replace("']", '');
                    $('.tradeOrderFooterComplete').attr("oadr", trnadr);


                }
                //    $(".tradeOrderTitle").html(action.toUpperCase() + ' ' + allOrds[ix].amount + ' ' + (allOrds[ix].coin + sss).toUpperCase())
                $(".completeOrderBut").prop("oid", allOrds[ix].id);


            }

        }
    }

}

function tradeManager(oid, action) {
    console.log('trade managing ', oid, action);

    $(".newTradeForm").css("display", 'none');
    // $(".confTradeForm").css("display", 'none');
    $(".newTransferForm").css("display", 'none');

    $(".doTradeForm").css("display", 'none');


    $("#newTradeTotal").attr("disabled", false);
    $("#newTradePrice").attr("disabled", false);
    $("#newTradeAmount").attr("disabled", true);


    $(".tradeOrderFooter").html('').prepend('<a href="#!" oid="' + oid + '" style="float:left;" class="tradeOrderFooterCancel red waves-effect waves-red btn-flat" action="cancel" disabled>Dispute</a>');
    $(".tradeOrderFooter").append('<a href="#!" action="' + action + '" oid="' + oid + '" class="tradeOrderFooterComplete waves-effect green waves-green btn-flat" disabled>Complete</a>');


    setOrderCallbacks();

    if (action == 'buy' && activeCoin.toLowerCase() == 'eth') {
        //this is an existing order

        //orderTimer = setInterval(function () {}, 15000);
        manageOrderDet(oid);
        $(".doTradeForm").css("display", 'block');
        //updateNewOrderDet('new', action);

        return;

    } else if (action == 'transfer') {
        $("#buySteps").css("display", "none");
        $("#slctPmntMthd").css("display", "none");

        //orderTimer = setInterval(function () {}, 15000);

        doNewTransfer();
        $(".newTransferForm").css("display", 'block');

        return;

    } else if (oid == 'new') {
        $("#buySteps").css("display", "none");
        $("#slctPmntMthd").css("display", "none");
        //this is a new order

        //orderTimer = setInterval(function () {}, 15000);
        updateNewOrderDet('new', action);

        $("#newTradePrice").val(allTokens[activeCoin.toLowerCase()].rate * baseX);

        return;

    } else if (action == 'manage') {
        $("#buySteps").css("display", "none");
        $("#slctPmntMthd").css("display", "block");
        //this is an existing order

        // orderTimer = setInterval(function () {}, 15000);
        manageOrderDet(oid);

        //$(".confTradeForm").css("display", 'block');
        $(".newTradeForm").css("display", 'block');


        $("#newTradeTotal").attr("disabled", true);

        return;

    } else if (action == 'sell') {
        $("#buySteps").css("display", "none");
        $("#slctPmntMthd").css("display", "none");
        //this is an existing order

        //orderTimer = setInterval(function () {}, 15000);
        manageOrderDet(oid);
        document.querySelector('.tradeOrderFooterComplete').setAttribute("disabled", true);
        $("#newTradeTotal").attr("disabled", true);
        $("#newTradePrice").attr("disabled", true);
        $("#newTradeAmount").attr("disabled", true);

        $(".newTradeForm").css("display", 'block');

        return;

    } else if (action == 'buy') {
        $("#buySteps").css("display", "block");
        $(".stepsHide").css("display", "none");
        $("#slctPmntMthd").css("display", "block");
        $(".tradeOrderFooter").css("display", "none");
        $("#buySteps").css("color", "grey");
        //this is an existing order

        $("#newTradeTotal").attr("disabled", true);
        $("#newTradePrice").attr("disabled", true);
        $("#newTradeAmount").attr("disabled", true);
        //orderTimer = setInterval(function () {}, 15000);
        manageOrderDet(oid);

        document.querySelector('.tradeOrderFooterComplete').setAttribute("disabled", true);
        $(".newTradeForm").css("display", 'block');
        $(".doTradeForm").css("display", 'block');

        return;

    }
    /*
        $(".doTradeForm").css("display", 'block');

        //orderTimer = setInterval(function () {
        //    orderWatch()
        //}, 15000);

        $(".confTradeForm").css("display", 'block');

        var store = getObjectStore('data', 'readwrite').get("market-orders");
        store.onsuccess = function (event) {

            var allOrds = JSON.parse(event.target.result);

            for (var ix in allOrds) {

                if (parseInt(allOrds[ix].id) == parseInt(oid)) {

                    //START enable or diasble cancel button
                    if (parseInt(allOrds[ix].tranFrom.uid) == parseInt(localStorage.getItem('bits-user-name')) || parseInt(allOrds[ix].tranTo.uid) == parseInt(localStorage.getItem('bits-user-name'))) {

                        $(".tradeOrderFooterCancel").attr("disabled", false);

                    } else {

                        //this is

                        $(".tradeOrderFooterCancel").attr("disabled", true);
                    }

                    //account for currency conversions
                    allOrds[ix].rate = JSON.stringify(parseFloat(allOrds[ix].rate) * baseConv);

                    //END enable or diasble cancel button


                    if (allOrds[ix].coin.endsWith("s")) {
                        var sss = ' TOKENS';
                    } else {
                        var sss = ' TOKENS';
                    }

                    var sendAmt = parseFloat((parseFloat(allOrds[ix].amount) * parseFloat(allOrds[ix].rate)).toFixed(2));

                    var cardTot = sendAmt + (sendAmt * 0.05);

                    $(".totalCardPay").html(cardTot.toFixed(2));

                    document.querySelector('#buyTokenButton').setAttribute('oid', allOrds[ix].id);
                    document.querySelector('#buyTokenButton').setAttribute('amount', cardTot);


                    if (action == 'buy') {

                        $(".tradeOrderSubTitle").html('BUYING ' + Math.floor10(parseFloat(allOrds[ix].amount), Math.abs(allTokens[allOrds[ix].coin].decimals) * -1) + ' ' + (allTokens[activeCoin.toLowerCase()].name + sss).toUpperCase());
                        $("#tokenPrice").html('BUY ' + Math.floor10(parseFloat(allOrds[ix].amount), Math.abs(allTokens[allOrds[ix].coin].decimals) * -1));
                        $("#tokenPrice").attr("amount", sendAmt)
                        $(".tradeOrderBody").html('Send ' + sendAmt + ' ' +
                            baseCd.toUpperCase() + ' to ' + allOrds[ix].tranFrom.name.split(" ") + ' at phone number ' + allOrds[ix].tranFrom.phone +
                            ' then enter the transaction code below.');
                        $(".tradeOrderImg").prop("src", allOrds[ix].tranFrom.icon);

                        $(".transStat").html('waiting for you to complete transaction');
                    } else if (action == 'sell') {
                        $(".tradeOrderSubTitle").html('SELLING ' + Math.floor10(parseFloat(allOrds[ix].amount), Math.abs(allTokens[allOrds[ix].coin].decimals) * -1) + ' ' + (allTokens[activeCoin.toLowerCase()].name + sss).toUpperCase());
                        $(".tradeOrderBody").html('Recieve ' + sendAmt + ' ' +
                            baseCd.toUpperCase() + ' at phone number ' + allOrds[ix].tranTo.phone +
                            ' then enter the transaction code below.');
                        $(".tradeOrderImg").prop("src", allOrds[ix].tranTo.icon);

                        $(".transStat").html('confirm payment below');
                    }
                    $(".tradeOrderTitle").html(action.toUpperCase() + ' ' + allOrds[ix].amount + ' ' + (allOrds[ix].coin + sss).toUpperCase())
                    $(".completeOrderBut").prop("oid", allOrds[ix].id);


                }

            }
        }
    */
}

//Steps Management 
$("#slctPmntMthd, #stept2").on("click", function (e) {
    $(".newTradeForm").css("display", "none");
    $(".stepsHide").css("display", "block");
    $(".stepsHide").css("margin-top", "20px");
    $("#slctPmntMthd").css("display", "none");
    $("#buySteps").css("color", "green");
    $(".tradeOrderFooter").css("display", "block");
});
$("#step1").on("click", function (e) {
    $("#buySteps").css("color", "grey");
    $(".stepsHide").css("display", "none");
    $(".newTradeForm").css("display", "block");
    $("#slctPmntMthd").css("display", "block");
    $(".tradeOrderFooter").css("display", "none");
})
