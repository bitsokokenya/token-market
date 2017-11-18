//Fetch rate
var finalRate;
var cKobo = "";
var xKobo = "";
var baseX;
var baseCd;

function sortOrderBookColor(){
var x = document.querySelectorAll('.element-' + activeCoin + '-coin');
                var i;
                for (i = 0; i < x.length; i++) {
                    x[i].style.display = 'table-row';
                }


                $($("#orderbookSep").prevAll("tr.element-" + activeCoin + "-coin")[0]).css({
                    "background-color": "rgb(255, 188, 188)"
                });
                $($("#orderbookSep").nextAll("tr.element-" + activeCoin + "-coin")[0]).css({
                    "background-color": "rgb(153, 255, 153)"
                });

}

function doNewTransfer() {

    $(".tradeOrderSubTitle").html('New Transfer');
    $(".tradeOrderBody").html('transfer ' + activeCoin + ' to a different address');

    $("#newTransferAmount").attr("placeholder", 'Max: ' + ((allTokens[activeCoin].balance / Math.pow(10, allTokens[activeCoin].decimals)) * (allTokens[activeCoin].rate * baseX)) + ' ' + baseCd);
    $("#newTransferAmount").attr("max", ((allTokens[activeCoin].balance / Math.pow(10, allTokens[activeCoin].decimals)) * (allTokens[activeCoin].rate * baseX)));



    $("#newTransferConfirmation,#newTransferAmount").change(function () {

        if (web3.isAddress($("#newTransferConfirmation").val()) && $('.newTransferForm')[0].checkValidity()) {

            $(".tradeOrderFooterComplete").attr("disabled", false);
        } else {

            $(".tradeOrderFooterComplete").attr("disabled", true);
        }

    });

}

function orderWatch() {
    if ($("#newTradeConfirmation").val().length > 0) {
        doFetch({
            action: 'orderWatcher',
            oid: $('.tradeOrderFooterComplete').attr("oid"),
            user: localStorage.getItem('bits-user-name'),
            orderRef: $("#newTradeConfirmation").val()
        }).then(function (e) {
            if (e.status == 'ok') {
		    
 $(".tradeOrderFooterCancel").html("dispute");
 				$(".tradeOrderFooterCancel").attr("action","dispute");

                $(".transStat").html(e.msg);
                M.toast({displayLength:5000, html: '<span class="toastlogin">order confirmed! completing trade</span>'});
	
           
            } else {

                $(".transStat").html(e.msg);
                 M.toast({displayLength:2000, html: '<span class="toastlogin">order not confirmed!</span>'});
	
            }
        });

    } else {

    M.toast({displayLength:2000, html: '<span class="toastlogin">enter transaction code</span>'});
	}



}

function refreshOrderBook() {
    console.log('should be updating order book!!!!!!');
    orderBookManager(baseX, baseCd);


}

function stopOrderWatch() {
    try {
        clearInterval(orderTimer);
    } catch (e) {
        console.log(e);
    }
}

function setOrderCallbacks() {

    $(".tradeOrderFooterComplete").click(function () {
        console.log($(this).attr("oid"), $(this).attr("action"));
        if ($(this).attr("action") == 'transfer') {
            //buy from orderbook
            console.log('transferring from wallet');

            transferTokenValue($("#newTransferConfirmation").val(), activeCoin, (parseFloat($("#newTransferAmount").val()))).then(function (r) {
                console.log(r);
                $('#tradeOrder').modal('close');
                 M.toast({displayLength:50000, html: '<span >sent succesfully!</span><button class="btn-flat toast-action" ><a href="https://etherscan.io/tx/' + r + '" target="_blank" class="btn-flat green-text">verify<a></button>'});
	
            }).catch(function (e) {
                console.log(e);
                M.toast({displayLength:5000, html: '<span >error adding order. does your wallet have enough gas?</span>'});
	
            });

        } else if ($(this).attr("oid") == 'new') {

            if ($(this).attr("action") == 'buy') {

                doFetch({
                    action: 'manageTradeOrder',
                    oid: 'new',
                    do: $(this).attr("action"),
                    user: localStorage.getItem('bits-user-name'),
                    amount: $("#newTradeAmount").val(),
                    coin: activeCoin,
                    rate: $("#newTradePrice").val(),
                    fiat: baseCd
                }).then(function (e) {
                    if (e.status == 'ok') {
                        $('#tradeOrder').modal('close');
                        refreshOrderBook();
                        M.toast({displayLength:5000, html: '<span >ok! waiting for seller..</span>'});
	
                    }
                });


            } else {


                M.toast({displayLength:5000, html: '<span >adding order, please wait..</span>'});
	
                var sendInFiat = $("#newTradePrice").val() * $("#newTradeAmount").val();

                transferTokenValue('0x7D1Ce470c95DbF3DF8a3E87DCEC63c98E567d481', activeCoin, (parseInt(sendInFiat) * 2)).then(function (r) {

                   

                    doFetch({
                        action: 'manageTradeOrder',
                        oid: 'new',
                        do: $(this).attr("action"),
                        user: localStorage.getItem('bits-user-name'),
                        amount: $("#newTradeAmount").val(),
                        coin: activeCoin,
                        rate: $("#newTradePrice").val(),
                        fiat: baseCd,
                        txHash: r
                    }).then(function (e) {
                        if (e.status == 'ok') {
                            $('#tradeOrder').modal('close');
			M.toast({displayLength:50000, html: '<span >ok! waiting for buyer..</span><button class="btn-flat toast-action" ><a href="https://etherscan.io/tx/' + r + '" target="_blank" style="margin:0px;" class="btn-flat green-text">verify<a></button>'});
			//orderBookManager(baseX, baseCd);
                        }
                    });



                }).catch(function (e) {
                    console.log(e);
                M.toast({displayLength:5000, html: '<span >error adding order. does your wallet have enough gas?</span>'});
	
                })

            }





        } else if ($(this).attr("action") == 'buy') {
            //buy from orderbook
            console.log('buying from orderbook')

        } else if ($(this).attr("action") == 'sell') {
            //buy from orderbook
            console.log('selling from orderbook')

        } else if ($(this).attr("action") == 'manage') {
            //managing from orderbook



            doFetch({
                action: 'manageTradeOrder',
                oid: $(this).attr("oid"),
                do: $(this).attr("action"),
                user: localStorage.getItem('bits-user-name'),
                amount: $("#newTradeAmount").val(),
                coin: activeCoin,
                rate: $("#newTradePrice").val(),
                fiat: baseCd
            }).then(function (e) {
                if (e.status == 'ok') {
                    $('#tradeOrder').modal('close');
                     M.toast({displayLength:5000, html: '<span >order modified! waiting for seller..</span>'});
	
                } else {
                    M.toast({displayLength:5000, html: '<span >order not modified!</span>'});
	
                }
            });




        }
    });

    $(".tradeOrderFooterCancel").click(function () {


        doFetch({
            action: 'manageTradeOrder',
            oid: $(this).attr("oid"),
            do: $(this).attr("action"),
            user: localStorage.getItem('bits-user-name')
        }).then(function (e) {
            if (e.status == 'ok') {
                $('#tradeOrder').modal('close');
 M.toast({displayLength:5000, html: '<span >order cancelled!</span>'});
	
            }
        });



    });

}






$(".newTrade").change(function () {

    updateNewOrderDet($('.tradeOrderFooterComplete').attr("oid"), $('.tradeOrderFooterComplete').attr("action"));

});



function updateNewOrderDet(oid, action) {
    if (activeCoin.endsWith("s")) {
        var sss = '';
    } else {
        var sss = 's';
    }

    if (parseFloat(($("#newTradePrice").val()) * parseFloat($("#newTradeAmount").val())) > 0 && $('.newTradeForm')[0].checkValidity()) {

        $(".tradeOrderFooterComplete").attr("disabled", false);
    } else {

        $(".tradeOrderFooterComplete").attr("disabled", true);
    }


    var orderPrice = parseFloat($("#newTradePrice").val());
    var orderAmount = parseFloat($("#newTradeAmount").val());
    var orderTotal = parseFloat($("#newTradeTotal").val());

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


    if (action == 'buy') {
        $("#newTradeTotal").attr("placeholder", 'eg: 1150');
        $("#newTradeTotal").attr("max", '');

        $(".tradeOrderSubTitle").html('NEW BUY ORDER: ' + orderTotal + ' ' + baseCd.toUpperCase());
        $(".tradeOrderBody").html('you will recieve ' + orderAmount.toFixed(allTokens[activeCoin].decimals) + ' ' + (activeCoin + sss).toUpperCase());
        $(".tradeOrderImg").prop("src", '/bitsAssets/images/currencies/' + activeCoin + '.png');
        //$(".tradeOrderFooter").append('<a href="#!" oid="new" action="buy" class="tradeOrderFooterComplete waves-effect green waves-green btn-flat" disabled>Complete</a>');

    } else if (action == 'sell') {

        $("#newTradeTotal").attr("placeholder", 'Max: ' + (((allTokens[activeCoin].balance / Math.pow(10, allTokens[activeCoin].decimals)) * 0.9) / 2)*orderPrice);
        $("#newTradeTotal").attr("max", (((allTokens[activeCoin].balance / Math.pow(10, allTokens[activeCoin].decimals)) * 0.9) / 2)*orderPrice);

        $(".tradeOrderSubTitle").html('NEW SELL ORDER: ' + orderTotal + ' ' + baseCd.toUpperCase());
        $(".tradeOrderBody").html('you will send ' + orderAmount.toFixed(allTokens[activeCoin].decimals) + ' ' + (activeCoin + sss).toUpperCase());
        $(".tradeOrderImg").prop("src", '/bitsAssets/images/currencies/' + activeCoin + '.png');
        // $(".tradeOrderFooter").append('<a href="#!" oid="new" action="sell" class="tradeOrderFooterComplete waves-effect green waves-green btn-flat" disabled>Complete</a>');
    }
    $("#newTradeAmount").val(res);
    $(".tradeOrderTitle").html('');
    $(".completeOrderBut").prop("oid", '');
    $(".transStat").html('placing new order..');
    setOrderCallbacks();

}




function manageOrderDet(oid) {
    var store = getObjectStore('data', 'readwrite').get("market-orders");
    store.onsuccess = function (event) {

        var allOrds = JSON.parse(event.target.result);

        for (var ix in allOrds) {

            if (parseInt(allOrds[ix].id) == parseInt(oid)) {
		
		console.log(allOrds[ix], parseInt(oid), parseInt(localStorage.getItem('bits-user-name')));
		    
                //START enable or diasble cancel button
                if (parseInt(allOrds[ix].tranFrom.uid) == parseInt(localStorage.getItem('bits-user-name')) || parseInt(allOrds[ix].tranTo.uid) == parseInt(localStorage.getItem('bits-user-name'))) {

                  
                   	if (allOrds[ix].state == 'pending'){
				$(".tradeOrderFooterCancel").html("cancel");
				$(".tradeOrderFooterCancel").attr("action","cancel");

		    
			    }else{
			     $(".tradeOrderFooterCancel").html("dispute");
 				$(".tradeOrderFooterCancel").attr("action","dispute");

			    }
			
			 $(".tradeOrderFooterCancel").attr("disabled", false);
                } else {

                  
                   	if (parseInt(allOrds[ix].state) == 'pending'){
				
                    $(".tradeOrderFooterCancel").attr("disabled", true);
		    
			    }else{
			     $(".tradeOrderFooterCancel").html("dispute");
 				$(".tradeOrderFooterCancel").attr("action","dispute");

                    $(".tradeOrderFooterCancel").attr("disabled", false);
			    }

                }

                //END enable or diasble cancel button


                if (allOrds[ix].coin.endsWith("s")) {
                    var sss = '';
                } else {
                    var sss = 's';
                }


                $("#newTradePrice").val(allOrds[ix].rate);
                $("#newTradeAmount").val(allOrds[ix].amount);
                $("#newTradeTotal").val((parseFloat(allOrds[ix].amount) * parseFloat(allOrds[ix].rate)).toFixed(2));

                if (parseInt(allOrds[ix].tranFrom) == 0) {

                    $(".tradeOrderSubTitle").html('BUYING ' + parseFloat(allOrds[ix].amount) + ' ' + (activeCoin + sss).toUpperCase());
                    $(".tradeOrderBody").html('Send ' + (parseFloat(allOrds[ix].amount) * parseFloat(allOrds[ix].rate)).toFixed(2) + ' ' +
                        baseCd.toUpperCase() + ' to ' + allOrds[ix].tranFrom.name.split(" ") + ' at phone number ' + allOrds[ix].tranFrom.phone +
                        ' then enter the transaction code below.');
                    $(".tradeOrderImg").prop("src", allOrds[ix].tranFrom.icon);

                    $(".transStat").html('waiting for seller to confirm payment..');
                } else if (parseInt(allOrds[ix].tranTo) == 0) {
                    $(".tradeOrderSubTitle").html('SELLING ' + parseFloat(allOrds[ix].amount) + ' ' + (activeCoin + sss).toUpperCase());
                    $(".tradeOrderBody").html('Recieve ' + (parseFloat(allOrds[ix].amount) * parseFloat(allOrds[ix].rate)).toFixed(2) + ' ' +
                        baseCd.toUpperCase() + ' at phone number ' + allOrds[ix].tranTo.phone + ' then enter the transaction code below.');
                    $(".tradeOrderImg").prop("src", allOrds[ix].tranTo.icon);

                    $(".transStat").html('confirm payment below');
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
    $(".confTradeForm").css("display", 'none');
    $(".newTransferForm").css("display", 'none');

    $(".tradeOrderFooter").html('').prepend('<a href="#!" oid="' + oid + '" style="float:left;" class="tradeOrderFooterCancel red waves-effect waves-red btn-flat" action="cancel" disabled>Dispute</a>');
    $(".tradeOrderFooter").append('<a href="#!" action="' + action + '" oid="' + oid + '" class="tradeOrderFooterComplete waves-effect green waves-green btn-flat" disabled>Complete</a>');


    if (action == 'transfer') {


        doNewTransfer();
        $(".newTransferForm").css("display", 'block');

        return;

    } else if (oid == 'new') {
        //this is a new order

        updateNewOrderDet(oid, action);
        $(".newTradeForm").css("display", 'block');

        return;

    } else if (action == 'manage') {
        //this is a new order

        manageOrderDet(oid);

        $(".confTradeForm").css("display", 'block');
        $(".newTradeForm").css("display", 'block');

        return;

    }

    $(".confTradeForm").css("display", 'block');

    setOrderCallbacks();
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

                //END enable or diasble cancel button


                if (allOrds[ix].coin.endsWith("s")) {
                    var sss = '';
                } else {
                    var sss = 's';
                }

                if (action == 'buy') {

                    $(".tradeOrderSubTitle").html('BUYING ' + parseFloat(allOrds[ix].amount) + ' ' + (activeCoin + sss).toUpperCase());
                    $(".tradeOrderBody").html('Send ' + (parseFloat(allOrds[ix].amount) * parseFloat(allOrds[ix].rate)).toFixed(2) + ' ' +
                        baseCd.toUpperCase() + ' to ' + allOrds[ix].tranFrom.name.split(" ") + ' at phone number ' + allOrds[ix].tranFrom.phone +
                        ' then enter the transaction code below.');
                    $(".tradeOrderImg").prop("src", allOrds[ix].tranFrom.icon);

                    $(".transStat").html('waiting for seller to confirm payment..');
                } else if (action == 'sell') {
                    $(".tradeOrderSubTitle").html('SELLING ' + parseFloat(allOrds[ix].amount) + ' ' + (activeCoin + sss).toUpperCase());
                    $(".tradeOrderBody").html('Recieve ' + (parseFloat(allOrds[ix].amount) * parseFloat(allOrds[ix].rate)).toFixed(2) + ' ' +
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

}

function orderBookManager(baseX, baseCd) {
    if (getBitsWinOpt('uid') == undefined) {

        var maker = CryptoJS.MD5(CryptoJS.MD5(localStorage.getItem('bits-user-name')).toString()).toString();

    } else {
        var maker = getBitsWinOpt('uid');
    };
    doFetch({
        action: 'getMarketOrders',
        tk: localStorage.getItem('bits-user-name'),
        user: maker
    }).then(function (e) {
        if (e.status == 'ok') {

            getObjectStore('data', 'readwrite').put(JSON.stringify(e.data), 'market-orders').onsuccess = function (event) {



                var oDs = e.data;
                $("#myOrders").html('');
                $("#myOrders").append('<tr style="background-color: #dad8d8;height: 40px;">' +
                    '<th></th>' +
                    '<th class="hidden-xs">AMOUNT</th>' +
                    '<th class="hidden-xs">'+baseCd.toUpperCase()+'</th>' +
                    '<th>TOTAL</th>' +
                    '<th></th>' +
                    '</tr>');
             
                
                $(".orderbookTbody").html('').append('<tr id="orderbookSep" style="background-color: #dad8d8;height: 40px;"><th>USER</th><th class="hidden-xs">AMOUNT</th><th class="hidden-xs">'+baseCd.toUpperCase()+'</th><th>TOTAL</th><th></th></tr>');
                var sells = [];
                var buys = [];
                makerTokens = [];
                for (var igg in oDs) {

                    makerTokens.push(oDs[igg].coin);
   
                    if (parseInt(oDs[igg].tranFrom) == 0) {
                        buys.push(oDs[igg]);
                    } else {

                        sells.push(oDs[igg]);
                    }

                }

                var uniqueArray = function (arrArg) {
                    return arrArg.filter(function (elem, pos, arr) {
                        return arr.indexOf(elem) == pos;
                    });
                };

                /*
                var uniqEs6 = (arrArg) => {
                  return arrArg.filter((elem, pos, arr) => {
                    return arr.indexOf(elem) == pos;
                  });
                }
                */

                makerTokens = uniqueArray(makerTokens);


                getAvailableCoins();

                sells.sort(function (a, b) {

                    return parseFloat(b.rate) - parseFloat(a.rate);
                });

                buys.sort(function (a, b) {

                    return parseFloat(b.rate) + parseFloat(a.rate);
                });

                var oDs = buys.concat(sells);

                myOrdCount = 0;
                myEscrowCount = 0;
                for (var ii in oDs) {

                    if (oDs[ii].state == 'pending') {

                        var icon = 'edit';
                    } else {

                        var icon = 'attach_money';
                    }
                    if (parseInt(oDs[ii].tranTo.uid) == parseInt(localStorage.getItem('bits-user-name'))) {

                        $("#myOrders").append('<tr class="element-' + oDs[ii].coin + '-coin element-all-coin">' +
                            '<td>BUY</td>' +
                            '<td class="hidden-xs">' + oDs[ii].amount + '</td>' +
                            '<td class="hidden-xs">' + parseFloat(oDs[ii].rate).toFixed(5) + '</td>' +
                            '<td>' + (parseFloat(oDs[ii].amount) * parseFloat(oDs[ii].rate)).toFixed(2) + '</td>' +
                            '<td><a class="waves-effect waves-light btn modal-trigger" href="#tradeOrder" style="padding:0 1rem" oid="' + oDs[ii].id + '" act="manage"><i class="material-icons right" style="margin: 0px;">' + icon + '</i></a></td>' +

                            '</tr>');
                    } else if (parseInt(oDs[ii].tranFrom.uid) == parseInt(localStorage.getItem('bits-user-name'))) {

                        $("#myOrders").append('<tr class="element-' + oDs[ii].coin + '-coin element-all-coin">' +
                            '<td>SELL</td>' +
                            '<td class="hidden-xs">' + oDs[ii].amount + '</td>' +
                            '<td class="hidden-xs">' + parseFloat(oDs[ii].rate).toFixed(5) + '</td>' +
                            '<td>' + (parseFloat(oDs[ii].amount) * parseFloat(oDs[ii].rate)).toFixed(2) + '</td>' +
                            '<td><a class="waves-effect waves-light btn modal-trigger" href="#tradeOrder" style="padding:0 1rem" oid="' + oDs[ii].id + '" act="manage"><i class="material-icons right" style="margin: 0px;">' + icon + '</i></a></td>' +
                            '</tr>');

                    }



                    if (oDs[ii].tranTo == 0 && oDs[ii].state == 'pending') {

                        //this is a buy order
                        oDs[ii].type = 'buy';

                        if (parseInt(oDs[ii].tranFrom.uid) == parseInt(localStorage.getItem('bits-user-name'))) {
                            myOrdCount++;
				try{
			
				allTokens[oDs[ii].coin].exchange = allTokens[oDs[ii].coin].exchange + ((oDs[ii].amount * Math.pow(10, allTokens[oDs[ii].coin].decimals)) * 2);

                            	allTokens[oDs[ii].coin].exchange = allTokens[oDs[ii].coin].exchange + (oDs[ii].amount * 2);

				}catch(er){
				console.log('INFO! unable to update exchange balance. is wallet locked? ',er);
				}
                           
                            var bAc = '<a class="waves-effect waves-light btn modal-trigger" href="#tradeOrder" disabled>BUY</a>';
                        } else {
                            var bAc = '<a class=" waves-effect waves-light btn modal-trigger" href="#tradeOrder" oid="' + oDs[ii].id + '" act="buy">BUY</a>';
                        }


                        $("#orderbookSep").before('<tr class="element-' + oDs[ii].coin + '-coin element-all-coin" style="background-color:#ffdcdc;height: 40px;" >' +
                            '<td ><img src="' + oDs[ii].tranFrom.icon + '" style="width: 35px;float: left;border-radius: 50px;position: relative;left: 10px;"><span class="odbk-txt hide-on-med-and-down">' + oDs[ii].tranFrom.name + '</span></td>' +
                            '<td class="hidden-xs">' + parseFloat(oDs[ii].amount).toFixed(5) + '</td>' +
                            '<td class="hidden-xs">' + parseFloat(oDs[ii].rate).toFixed(5) + '</td>' +
                            '<td>' + (parseFloat(oDs[ii].amount) * parseFloat(oDs[ii].rate)).toFixed(2) + '</td>' +
                            '<td>' + bAc +
                            '</td></tr>');

                    } else if (oDs[ii].tranFrom == 0 && oDs[ii].state == 'pending') {

                        //this is a sell order

                        oDs[ii].type = 'sell';
                        if (parseInt(oDs[ii].tranTo.uid) == parseInt(localStorage.getItem('bits-user-name'))) {
                            myOrdCount++;


                            var bAc = '<a class="waves-effect waves-light btn modal-trigger" href="#tradeOrder" disabled>SELL</a>';
                        } else {
				try{
			var coinba = allTokens[oDs[ii].coin].balance;
				}catch(er){
					
			var coinba = 0;
				console.log('INFO! unable to update exchange balance. is wallet locked? ',er);
				}
				
                            try{
                            if (coinba < 1) {
                                var bAc = '<a class="waves-effect waves-light btn modal-trigger" href="#tradeOrder" oid="' + oDs[ii].id + '" act="sell" disabled>SELL</a>';

                            } else {
                                var bAc = '<a class="waves-effect waves-light btn modal-trigger" href="#tradeOrder" oid="' + oDs[ii].id + '" act="sell">SELL</a>';

                            }
                            }catch(err){
                              var bAc = '<a class="waves-effect waves-light btn modal-trigger" href="#tradeOrder" oid="' + oDs[ii].id + '" act="sell" disabled>SELL</a>';

                            }
                            
                        }

                        $("#orderbookSep").after('<tr class="element-' + oDs[ii].coin + '-coin element-all-coin" style="background-color:#dcffdc;height: 40px;">' +
                            '<td ><img src="' + oDs[ii].tranTo.icon + '" style="width: 35px;float: left;border-radius: 50px;position: relative;left: 10px;"><span class="odbk-txt hide-on-med-and-down">' + oDs[ii].tranTo.name + '</span></td>' +
                            '<td class="hidden-xs">' + parseFloat(oDs[ii].amount).toFixed(5) + '</td>' +
                            '<td class="hidden-xs">' + parseFloat(oDs[ii].rate).toFixed(5) + '</td>' +
                            '<td>' + (parseFloat(oDs[ii].amount) * parseFloat(oDs[ii].rate)).toFixed(2) + '</td>' +
                            '<td>' + bAc +
                            '</td></tr>');
                    }



                }

                if (myOrdCount > 4) {

                    $(".trade-new-Button").attr("disabled", true);
                } else {

                    $(".trade-new-Button").attr("disabled", false);
                }

                var tokenTab = allTokens['allTokens'];
                for (i = 0; i < tokenTab.length; i++) {

                    $('.exchange-' + tokenTab[i] + '-Balance').html(((allTokens[tokenTab[i]].exchange / Math.pow(10, allTokens[tokenTab[i]].decimals)) * (allTokens[tokenTab[i]].rate * baseX)).toFixed(2) + ' ' + baseCd.toUpperCase());
                }

                var x = document.querySelectorAll(".element-all-coin");
                var i;
                for (i = 0; i < x.length; i++) {
                    x[i].style.display = 'none';
                }
                sortOrderBookColor()

                $('.orderbook').animate({
                    scrollTop: $("#orderbookSep").offset().top - ($("#orderbookSep").offset().top / 2)
                }, 1000);


                //end for loop orders
            }


        };

    });
}

function starting() {

    //user wants to trade so hide default landing page
    if (getBitsWinOpt('uid')) $("#tokenSelect").hide();
    walletFunctions(localStorage.getItem('bits-user-name')).then(function (u) {
	    
new M.Modal(document.querySelector('#userAccount'), {
	ready:function(e){
		showAddr('0x'+localStorage.getItem('bits-user-address-' + localStorage.getItem('bits-user-name')))
		}
});

        /////////////////////////////////// start update exchange rates

        fetchRates().then(function (e) {
            if (e.status == "ok") {
                coinList = e.data.data;
                var rate = coinList[0].coinRate;
                var bankCharges = 5; // %
                baseX = e.data.baseEx;
                baseCd = e.data.baseCd;
                finalRate = rate * (e.data.baseEx + ((e.data.baseEx * bankCharges) / 100)); //inclusive bank charges



                $("#fetchedRate").html(finalRate.toFixed(2));
                $('.orderbook').animate({
                    scrollTop: 40
                }, 1000);

                $('.modal').modal({
                    dismissible: true, // Modal can be dismissed by clicking outside of the modal
                    opacity: .5, // Opacity of modal background
                    inDuration: 300, // Transition in duration
                    outDuration: 200, // Ending top style attribute
                    ready: function (modal, trigger) { // Callback for Modal open. Modal and trigger parameters available.
                        tradeManager($(trigger).attr('oid'), $(trigger).attr('act'));
                        if ($(trigger).attr('oid') == "new") {

                        } else {

                            orderTimer = setInterval(function () {
                                orderWatch()
                            }, 15000);

                        }


                        $("#newTradePrice").val(allTokens[activeCoin].rate * baseX);
                    },
                    complete: function () {
                        stopOrderWatch()
                    } // Callback for Modal close
                });
                /*
                            if (window.PaymentRequest) {
                                payButton.setAttribute('style', 'display: inline;');
                                payButton.addEventListener('click', function () {
                                    initPaymentRequest().show().then(function (instrumentResponse) {
                                            sendPaymentToServer(instrumentResponse);
                                        })
                                        .catch(function (err) {
                                            ChromeSamples.setStatus(err);
                                        });
                                });
                            } else {
                                console.log('This browser does not support web payments');
                            }
                		
                		*/

                orderBookManager(e.data.baseEx, e.data.baseCd);
		    try{
		   
		startPushManager(); 
		    }catch(er){
		    console.log('INFO! not started messaging ',er)
		    }
            } else {
                console.log("error");
            }
        });

        ///////////////////////////// end update exchange rates//////////////////////////////////////////////////////////////////////

    })
    profileImg();
}

function getAvailableCoins() {
    var ownerTab = allTokens['ownerTokens'];
   
    
                if (getBitsWinOpt('uid')) {
                    var tokenTab = makerTokens;
                 }else{
                 var tokenTab = allTokens['balanceTokens'];
                };
    
    
    if (getBitsWinOpt('uid') == CryptoJS.MD5(CryptoJS.MD5(localStorage.getItem('bits-user-name')).toString()).toString()) {

        var tokenTab = squash(makerTokens.concat(allTokens['balanceTokens']));

    }
    
    $(".myCoins").html('');

    $(".availableCoins").html('');

    if (ownerTab.length == 0) {
        $(".myCoins").append('<li style="cursor: pointer;"><a coin="createNew"><img style="width: 60px; border-radius: 50%;" src="/bitsAssets/images/currencies/new.png"><p style="margin: 0; color: white; text-transform: uppercase;">create new</p></a></li>')

    }

    if (tokenTab.length == 0) {
        $(".availableCoins").append('<li><a coin="noCoin"><img style="width: 60px; border-radius: 50%;" src="/bitsAssets/images/currencies/none.png"><p style="margin: 0; color: white; text-transform: uppercase;">no tokens in your wallet</p></a></li>')

    }

    for (i = 0; i < ownerTab.length; i++) {

    }


    for (i = 0; i < tokenTab.length; i++) {

        $(".coinTab").append('<li class="tab col s2" style="width: calc(100% / ' + tokenTab.length + ')!important;"><a href="#' + tokenTab[i] + '" style="color:#bbbaba;position: relative;"><img class="imgTab" src="/bitsAssets/images/currencies/' + tokenTab[i] + '.png" style="width: 30px; position: absolute; left: 40%; top: 10px;">' + tokenTab[i] + '</a></li>')
        $(".availableCoins").append('<li style="cursor: pointer;"><a coin="' + tokenTab[i] + '"><img style="width: 60px; border-radius: 50%;" src="/bitsAssets/images/currencies/' + tokenTab[i] + '.png"><p style="margin: 0; color: white; text-transform: uppercase;">' + tokenTab[i] + '</p></a></li>')
        $(".coinContent").append('<div id="' + tokenTab[i] + '" class="col s12 hero" style="font-size: 2em;text-transform: uppercase; color: white; line-height: 850%; display: block; margin-top: -45px;height: 250px;"><div class="row"> <div class="col s12 m4 coinDataHolda"><div class="row"><div class="col s4"><img style="width: 90px;border-radius: 50%;margin-right: -10px;top: 30px;position: relative;" src="/bitsAssets/images/currencies/' + tokenTab[i].replace('-kovan', '') + '.png"></div><div class="col s8"><p style=" margin: 0px;"><span style=" border-left: solid white 15px; margin-right: 20px;"></span>' + tokenTab[i] + '</p></div></div></div><div class="col s12 m4 hide-on-med-and-down"><table class="striped coinInfo coinDataHolda" id="blocks" style="line-height: 20px;width: 250px;font-size: 14px;background-color: transparent!important;position: relative;top:80px; display: block; margin-left: auto; margin-right: auto;">' +
            '<tbody style="height: 350px;"><tr><th style="">Capitalization</th><th class="coindata-' + tokenTab[i] + '-mcap">0.00</th>' +
            '</tr><tr><th>Volume</th><th class="coindata-' + tokenTab[i] + '-vol">0.00</th></tr>' +
            '<tr><th>Price</th><th class="coindata-' + tokenTab[i] + '-price">0.00</th></tr>' +
            '<tr><th></th><th></th></tr>' +
            '<tr><th>Website</th><th><a href="" target="_blank" style="text-transform:lowercase;color: #ffffff;" class="coindata-' + tokenTab[i] + '-wpage"></a></th></tr>' +
            '</tbody></table></div><div class="col s12 m4 " style="text-align: center; position: relative;margin-top: 50px;"><h5 style="font-size: 1em; font-weight: bold; width: 136px; position: absolute; top: 45px; font-size: 0.6em; display: block; right: 117px;">BALANCES</h5><table class="striped buySell" id="blocks" style="line-height: 20px;width: 50px;float: right;font-size: 14px;top: 10%;background-color: transparent!important;position: relative;right:10%;top:80px;">' +
            '<tbody style="height: 350px;"><tr><th style="">wallet</th><th class="wallet-' + tokenTab[i] + '-Balance">locked</th></tr>' +
            '<tr><th>exchange</th><th class="exchange-' + tokenTab[i] + '-Balance">locked</th></tr><tr>' +
            '<tr><th></th><th></th></tr>' +
            '<tr><th><div class="popup buyTour" style="position: absolute;left: -115%;z-index:10;bottom: -50px;display:none;"> <span class="buyPopupText" id="myPopup"><p style=" text-transform: initial; padding: 10px; font-size: 1em; font-weight: 500; margin: 0;">Add a new buy order. To complete your transaction, you will have to enter the transaction code to confirm payment.</p><div class="modal-footer"> <a href="#!" class="modal-action modal-close waves-effect waves-green btn-flat openSellTour" style=" float: right;">next</a> </div></span><p class="blink" style="font-size: 5em;position: absolute;color: red;top: 0px;line-height: 0;margin:0px;z-index:10;">&nbsp;.</p></div><a class="trade-new-Button waves-effect waves-light btn modal-trigger" href="#tradeOrder" style="width: 130px; position:relative; overflow:initial;" oid="new" act="buy"><i class="material-icons left">file_download</i>BUY</a></th>' +
            '<th><div class="popup sellTour" style=" position: absolute; z-index: 10; bottom: -245%; right: 42%; display:none;"><span class="sellPopupText" id="myPopup"><p style=" margin: 10px; font-size: 1em; font-weight: 500; text-transform: initial;">Add a new sell order. To complete 2X your total order amount will be sent to the escrow service. you will be refunded 1X after the transaction is completed succesfully.</p><div class="modal-footer"> <a href="#!" class="modal-action modal-close waves-effect waves-green btn-flat openTransferTour" style="float: right;font-size: 0.85em;">next</a> </div></span></div><a class="trade-' + tokenTab[i] + '-Button trade-new-Button waves-effect waves-light btn modal-trigger" href="#tradeOrder" style="width: 130px; position:relative;" oid="new" act="sell"><i class="material-icons right">file_upload</i>SELL</a></th></tr>' +
            '</tr></tbody></table><table class="striped trnsf" id="blocks" style="line-height: 20px;width: 275px;float: right;font-size: 14px;background-color: transparent!important;position: relative;top: 90px;right: 28px;">' +
            '<tbody style="height: 350px;"><tr><td style="width: 200%;padding: 5px;"><div class="popup transferTour" style=" position: absolute; z-index: 10; bottom: -410%; display:none;"> <span class="transferPopupText" id="myPopup" style=""><p style=" font-weight: 500; text-transform: initial; padding: 10px;">Transfer to a different ethereum address. Fees will be included in transfer amount.</p><div class="modal-footer"> <a href="#!" class="modal-action modal-close waves-effect waves-green btn-flat openOrderBookTour" style=" float: right;">next</a> </div></span></div><a class="transfer-' + tokenTab[i] + '-Button waves-effect waves-light btn modal-trigger red" href="#tradeOrder" style="width: 100%;" oid="new" act="transfer"><i class="material-icons right">redo</i>Transfer</a></td>' +
            '</tr></tbody></table></div></div></div>');

       // $('ul.tabs').tabs('select_tab', 'tab_id');
        $('ul.tabs').tabs();
try{
if (allTokens[tokenTab[i]].balance > 0) {
            $('.trade-' + tokenTab[i] + '-Button').attr('disabled', false)
        } else {
            $('.trade-' + tokenTab[i] + '-Button').attr('disabled', true)
        }

}catch(err){
   // probably the users wallets are unloaded/locked
console.log(err);
}
        

    }

    activeCoin = tokenTab[0];
    $('.wallet-' + activeCoin + '-Balance').html('locked');

    $(".activeCoin").text(activeCoin)
    $(document).on("click", ".coinTab li a", function () {
        activeCoin = $(".active").attr('href').replace(/#/, '');
        $("#tokenImg").attr("src", "/bitsAssets/images/currencies/" + activeCoin + ".png");

        $(".activeCoin").text(activeCoin);
        var x = document.querySelectorAll(".element-all-coin");
        var i;
        for (i = 0; i < x.length; i++) {
            x[i].style.display = 'none';
        }
        var x = document.querySelectorAll('.element-' + activeCoin + '-coin');
        var i;
        for (i = 0; i < x.length; i++) {
            x[i].style.display = 'table-row';
        }
        fetchRates().then(function (e) {
            if (e.status == "ok") {

                $('.coindata-' + activeCoin + '-wpage').attr('href', allTokens[activeCoin].webpage.toLowerCase());
                $('.coindata-' + activeCoin + '-wpage').html(allTokens[activeCoin].webpage.toLowerCase());
                $('.coindata-' + activeCoin + '-mcap').html(numberify(((allTokens[activeCoin].rate * e.data.baseEx) * allTokens[activeCoin].supply)) + ' ' + e.data.baseCd.toUpperCase());
                $('.coindata-' + activeCoin + '-price').html((allTokens[activeCoin].rate * e.data.baseEx).toFixed(2) + ' ' + e.data.baseCd.toUpperCase());
                $('.wallet-' + activeCoin + '-Balance').html('').append((allTokens[activeCoin].balance / Math.pow(10, allTokens[activeCoin].decimals) * allTokens[activeCoin].rate * e.data.baseEx).toFixed(2) + ' ' + e.data.baseCd.toUpperCase());
		sortOrderBookColor();

            } else {
                console.log("error");
            }
        });
    });
    // $('.modal').modal();
    doFetch({
        action: 'userVerified',
        uid: JSON.parse(localStorage.getItem("bits-user-name"))
    }).then(function (e) {
        if (e.data != "true") {
            Materialize.toast('Please verify you phone number to continue', 5000);
            $('.modal').modal();
            $("#mobiVeri").modal("open");
        }
    })
}

//Enable Loyalty
$('.loyaltyCls').click(function () {
    $('#loyaltyModal').modal('close');
});


//Buy Points
function initPaymentRequest() {
    let networks = ['mastercard', 'visa'];
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
            label: 'Loyalty Points',
            amount: {
                currency: 'KES',
                value: document.getElementById('buyPoints').value * finalRate
            }
        },
        displayItems: [
            {
                label: '1 point = ',
                amount: {
                    currency: 'KES',
                    value: finalRate.toFixed(2)
                },
      },
    ],
    };

    return new PaymentRequest(supportedInstruments, details);
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
                ChromeSamples.setStatus(err);
            });
    }, 2000);
}

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

//const payButton = document.getElementById('buy100');

//payButton.setAttribute('style', 'display: none;');

$(document).on("click", "#rewardsPage", function () {
    $(".navbar-color").css("box-shadow", "none");
});


//Clear Local Storage
$("#reload").click(function () {
    localStorage.clear();
    var cookies = document.cookie.split(";");
    for (var i = 0; i < cookies.length; i++) {
        var spcook = cookies[i].split("=");
        deleteCookie(spcook[0]);
    }

    function deleteCookie(cookiename) {
        var d = new Date();
        d.setDate(d.getDate() - 1);
        var expires = ";expires=" + d;
        var name = cookiename;
        //alert(name);
        var value = "";
        document.cookie = name + "=" + value + expires + "; path=/acc/html";
    }
    location.reload();
})
//TOUR
$('#startTour').click(function () {
    var buyTour = $(".buyTour");
    var ctr = 1;
    buyTour.className = buyTour.className !== 'show' ? 'show' : 'hide';
    if (buyTour.className === 'show') {
        buyTour.css("display", "block");
        window.setTimeout(function () {
            buyTour.css("opacity", "1");
            buyTour.css("transform", "scale(1)");
        }, 0);
    }
    $(".transferTour").css("opacity", "0");
    $(".transferTour").css("transform", "scale(0)");
    window.setTimeout(function () {
        $(".transferTour").css("display", "none");
    }, 700);
    $(".sellTour").css("transform", "scale(0)");
    window.setTimeout(function () {
        $(".sellTour").css("display", "none");
    }, 700);
    $(".orderBookTour").css("opacity", "0");
    $(".orderBookTour").css("transform", "scale(0)");
    window.setTimeout(function () {
        $(".orderBookTour").css("display", "none");
    }, 700);
    $(".myOrdersTour").css("opacity", "0");
    $(".myOrdersTour").css("transform", "scale(0)");
    window.setTimeout(function () {
        $(".myOrdersTour").css("display", "none");
    }, 700);
})
$(document).on('touchstart click', '.openSellTour', function (event) {
    $(".buyTour").css("opacity", "0");
    $(".buyTour").css("transform", "scale(0)");
    window.setTimeout(function () {
        $(".buyTour").css("display", "none");
    }, 700);

    $(".sellTour").css("display", "block");
    window.setTimeout(function () {
        $(".sellTour").css("opacity", "1");
        $(".sellTour").css("transform", "scale(1)");
    }, 0);
});
$(document).on('touchstart click', '.openTransferTour', function (event) {
    $(".sellTour").css("opacity", "0");
    $(".sellTour").css("transform", "scale(0)");
    window.setTimeout(function () {
        $(".sellTour").css("display", "none");
    }, 700);
    $(".transferTour").css("display", "block");
    window.setTimeout(function () {
        $(".transferTour").css("opacity", "1");
        $(".transferTour").css("transform", "scale(1)");
    }, 0);
});
$(document).on('touchstart click', '.openOrderBookTour', function (event) {
    $(".transferTour").css("opacity", "0");
    $(".transferTour").css("transform", "scale(0)");
    window.setTimeout(function () {
        $(".transferTour").css("display", "none");
    }, 700);
    $(".orderBookTour").css("display", "block");
    window.setTimeout(function () {
        $(".orderBookTour").css("opacity", "1");
        $(".orderBookTour").css("transform", "scale(1)");
    }, 0);
});
$(document).on('touchstart click', '.openMyOrderTour', function (event) {
    $(".orderBookTour").css("opacity", "0");
    $(".orderBookTour").css("transform", "scale(0)");
    window.setTimeout(function () {
        $(".orderBookTour").css("display", "none");
    }, 700);
    $(".myOrdersTour").css("display", "block");
    window.setTimeout(function () {
        $(".myOrdersTour").css("opacity", "1");
        $(".myOrdersTour").css("transform", "scale(1)");
    }, 0);
});
$(document).on('touchstart click', '.finishTour', function (event) {
    $(".myOrdersTour").css("opacity", "0");
    $(".myOrdersTour").css("transform", "scale(0)");
    window.setTimeout(function () {
        $(".myOrdersTour").css("display", "none");
    }, 700);
});



//Get Profile Image
function profileImg() {
    var userId = localStorage.getItem("bits-user-name")
    getObjectStore('data', 'readwrite').get("user-profile-" + userId + "").onsuccess = function (event) {
        var userProfImg = JSON.parse(event.srcElement.result).image;
        var userProfName = JSON.parse(event.srcElement.result).name;
        $(".userImg").attr("src", userProfImg);
        $(".userProfName").text(userProfName);
    }
}



//Side Nav
function openNav() {
    document.getElementById("mySidenav").style.width = "300px";
}

function closeNav() {
    document.getElementById("mySidenav").style.width = "0";
}
