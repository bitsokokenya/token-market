
function orderBookManager(baseX, baseCd) {

    return new Promise(function (resolve, reject) {

/*

        if (getBitsWinOpt('uid') != undefined) {

            var maker = getBitsWinOpt('uid');


            doFetch({
                action: 'getMarketOrders',
                tk: localStorage.getItem('bits-user-name'),
                user: maker
            }).then(function (e) {
                if (e.status == 'ok') {
                    $('.preloader-wrapper').css('display', 'none');
                    getObjectStore('data', 'readwrite').put(JSON.stringify(e.data), 'market-orders').onsuccess = function (event) {



                        var oDs = e.data;

                        myOpenOrders(oDs);
                        if (getBitsWinOpt('cid')) {
                            var coinHo = allTokens[getBitsWinOpt('cid').toLowerCase()].name.toUpperCase();
                        } else {
                            var coinHo = 'AMOUNT';

                        }

                        $(".orderbookTbody").html('').append('<tr id="orderbookSep" style="background-color: #dad8d8;height: 40px;"><th>USER</th><th class="hidden-xs">' + coinHo + '</th><th class="hidden-xs"> PRICE ' + baseCd.toUpperCase() + '</th><th>TOTAL</th><th></th></tr>');
                        var sells = [];
                        var buys = [];
                        makerTokens = [];
                        for (var igg in oDs) {
                            if (oDs[igg].coin != 'eth' && oDs[igg].contract.length > 1) {
                                makerTokens.push(oDs[igg].contract.toLowerCase());

                            }


                            //account for currency conversions
                            oDs[igg].rate = JSON.stringify(parseFloat(oDs[igg].rate) * baseConv);


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

                        
                        //var uniqEs6 = (arrArg) => {
                        //  return arrArg.filter((elem, pos, arr) => {
                        //    return arr.indexOf(elem) == pos;
                        //  });
                        //}
                        

                        makerTokens = uniqueArray(makerTokens);


                        sells.sort(function (a, b) {

                            return parseFloat(b.amount) - parseFloat(a.amount);
                        });

                        sells.sort(function (a, b) {

                            return parseFloat(b.rate) - parseFloat(a.rate);
                        });

                        buys.sort(function (a, b) {

                            return parseFloat(b.amount) + parseFloat(a.amount);
                        });
                        buys.sort(function (a, b) {

                            return parseFloat(b.rate) + parseFloat(a.rate);
                        });

                        var oDs = buys.concat(sells);

                        myOrdCount = 0;
                        myEscrowCount = 0;
                        for (var ii in oDs) {
                            try {

                                var deci = allTokens[oDs[ii].coin].decimals ? allTokens[oDs[ii].coin].decimals : 5;

                            } catch (err) {
                                //TO-DO
                                //this should not be happening!!
                                console.log(err);

                                var deci = 5;
                            }


                            if (oDs[ii].tranTo == 0 && oDs[ii].state == 'pending' && oDs[ii].trading == 'false') {

                                //this is a buy order
                                oDs[ii].type = 'buy';

                                if (parseInt(oDs[ii].tranFrom.uid) == parseInt(localStorage.getItem('bits-user-name'))) {
                                    myOrdCount++;
                                    try {

                                        //allTokens[oDs[ii].coin].exchange = allTokens[oDs[ii].coin].exchange + ((oDs[ii].amount * Math.pow(10, allTokens[oDs[ii].coin].decimals)) * 2);

                                        allTokens[oDs[ii].contract].exchange = allTokens[oDs[ii].contract].exchange + (oDs[ii].amount * 2);

                                    } catch (er) {
                                        console.log('INFO! unable to update exchange balance. is wallet locked? ', er);
                                    }

                                    var bAc = '<a id="oid-act-' + oDs[ii].id + '" class="waves-effect waves-light btn modal-trigger" href="#tradeOrder" disabled>BUY</a>';
                                } else {
                                    var bAc = '<a id="oid-act-' + oDs[ii].id + '" class=" waves-effect waves-light btn modal-trigger" href="#tradeOrder" oid="' + oDs[ii].id + '" act="buy">BUY</a>';
                                }


                                if (getBitsWinOpt('uid') == CryptoJS.MD5(CryptoJS.MD5(JSON.stringify(oDs[ii].tranFrom.uid)).toString()).toString() || getBitsWinOpt('cid')) {
                                    $("#orderbookSep").before('<tr class="element-' + oDs[ii].coin + '-coin element-all-coin" style="background-color:#ffdcdc;height: 40px;" >' +
                                        '<td ><img src="' + oDs[ii].tranFrom.icon + '" style="width: 35px;float: left;border-radius: 50px;position: relative;left: 10px;"><span class="odbk-txt hide-on-med-and-down">' + oDs[ii].tranFrom.name + '</span></td>' +
                                        '<td class="hidden-xs">' + Math.round10(parseFloat(oDs[ii].amount), (deci / -1)) + '</td>' +
                                        '<td class="hidden-xs">' + parseFloat(oDs[ii].rate).toFixed(5) + '</td>' +
                                        '<td>' + (parseFloat(oDs[ii].amount) * parseFloat(oDs[ii].rate)).toFixed(2) + '</td>' +
                                        '<td>' + bAc +
                                        '</td></tr>');
                                }

                            } else if (oDs[ii].tranFrom == 0 && oDs[ii].state == 'pending') {

                                //this is a sell order

                                oDs[ii].type = 'sell';
                                if (parseInt(oDs[ii].tranTo.uid) == parseInt(localStorage.getItem('bits-user-name'))) {
                                    myOrdCount++;


                                    var bAc = '<a class="waves-effect waves-light btn modal-trigger" href="#tradeOrder" disabled>SELL</a>';
                                } else {
                                    try {
                                        var coinba = allTokens[oDs[ii].coin].balance;
                                    } catch (er) {

                                        var coinba = 0;
                                        console.log('INFO! unable to update exchange balance. is wallet locked? ', er);
                                    }

                                    try {
                                        if (coinba < 1) {
                                            var bAc = '<a id="oid-act-' + oDs[ii].id + '"  class="waves-effect waves-light btn modal-trigger" href="#tradeOrder" oid="' + oDs[ii].id + '" act="sell" disabled>SELL</a>';

                                        } else {
                                            var bAc = '<a id="oid-act-' + oDs[ii].id + '"  class="waves-effect waves-light btn modal-trigger" href="#tradeOrder" oid="' + oDs[ii].id + '" act="sell">SELL</a>';

                                        }
                                    } catch (err) {
                                        var bAc = '<a id="oid-act-' + oDs[ii].id + '"  class="waves-effect waves-light btn modal-trigger" href="#tradeOrder" oid="' + oDs[ii].id + '" act="sell" disabled>SELL</a>';

                                    }

                                }

                                if (getBitsWinOpt('uid') == CryptoJS.MD5(CryptoJS.MD5(JSON.stringify(oDs[ii].tranTo.uid)).toString()).toString() || getBitsWinOpt('cid')) {

                                    $("#orderbookSep").after('<tr class="element-' + oDs[ii].coin + '-coin element-all-coin" style="background-color:#dcffdc;height: 40px;">' +
                                        '<td ><img src="' + oDs[ii].tranTo.icon + '" style="width: 35px;float: left;border-radius: 50px;position: relative;left: 10px;"><span class="odbk-txt hide-on-med-and-down">' + oDs[ii].tranTo.name + '</span></td>' +
                                        '<td class="hidden-xs">' + Math.round10(parseFloat(oDs[ii].amount), (deci / -1)) + '</td>' +
                                        '<td class="hidden-xs">' + parseFloat(oDs[ii].rate).toFixed(5) + '</td>' +
                                        '<td>' + (parseFloat(oDs[ii].amount) * parseFloat(oDs[ii].rate)).toFixed(2) + '</td>' +
                                        '<td>' + bAc +
                                        '</td></tr>');

                                }



                            }

                            if (oDs[ii].trading == 'true') {
                                $("#oid-act-" + oDs[ii].id).html('trading');
                                $("#oid-act-" + oDs[ii].id).attr("disabled", true);

                            }


                            try {
                                $('.exchange-' + oDs[ii].coin + '-Balance').html(((allTokens[oDs[ii].coin].exchange / Math.pow(10, allTokens[oDs[ii].coin].decimals)) * (allTokens[oDs[ii].coin].rate * baseX)).toFixed(2) + ' ' + baseCd.toUpperCase());

                            } catch (err) {
                                console.log('!INFO did not update exchange balances')
                            }


                        }

                        if (myOrdCount > 4) {

                            $(".trade-new-Button").attr("disabled", true);
                        } else {

                            $(".trade-new-Button").attr("disabled", false);
                        }

                        // var tokenTab = allTokens['allTokens'];
                        // for (i = 0; i < tokenTab.length; i++) {

                        //     $('.exchange-' + tokenTab[i] + '-Balance').html(((allTokens[tokenTab[i]].exchange / Math.pow(10, allTokens[tokenTab[i]].decimals)) * (allTokens[tokenTab[i]].rate * baseX)).toFixed(2) + ' ' + baseCd.toUpperCase());
                        // }


                        $('.orderbook').animate({
                            scrollTop: $("#orderbookSep").offset().top - ($("#orderbookSep").offset().top / 2)
                        }, 1000);


                        //end for loop orders


                        resolve('orderBook updated');

                    }


                };

            });

        } else 
            
            */
        
        if (getBitsWinOpt('cid') != undefined) {


            doFetch({
                action: 'getMarketOrders',
                tk: localStorage.getItem('bits-user-name'),
                contract: getBitsWinOpt('cid')
            }).then(function (e) {
                if (e.status == 'ok') {
                    $('.preloader-wrapper').css('display', 'none');
                    getObjectStore('data', 'readwrite').put(JSON.stringify(e.data), 'market-orders').onsuccess = function (event) {



                        var oDs = e.data;

                        myOpenOrders(oDs);
                        $(".orderbookTbody").html('').append('<tr id="orderbookSep" style="background-color: #dad8d8;height: 40px;"><th>USER</th><th class="hidden-xs">AMOUNT</th><th class="hidden-xs"> PRICE ' + baseCd.toUpperCase() + '</th><th>TOTAL</th><th></th></tr>');
                        var sells = [];
                        var buys = [];
                        makerTokens = [];
                        for (var igg in oDs) {

                            //account for currency conversions
                            oDs[igg].rate = JSON.stringify(parseFloat(oDs[igg].rate) * baseConv);

                            makerTokens.push(oDs[igg].contract);

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


                        sells.sort(function (a, b) {

                            return parseFloat(b.amount) - parseFloat(a.amount);
                        });

                        sells.sort(function (a, b) {

                            return parseFloat(b.rate) - parseFloat(a.rate);
                        });

                        buys.sort(function (a, b) {

                            return parseFloat(b.amount) + parseFloat(a.amount);
                        });
                        buys.sort(function (a, b) {

                            return parseFloat(b.rate) + parseFloat(a.rate);
                        });

                        var oDs = buys.concat(sells);

                        myOrdCount = 0;
                        myEscrowCount = 0;

                        for (var ii in oDs) {
                            try {

                                var deci = allTokens[oDs[ii].contract.toLowerCase()].decimals ? allTokens[oDs[ii].contract.toLowerCase()].decimals : 5;

                            } catch (err) {
                                //TO-DO
                                //this should not be happening!!
                                console.log(err);
                                allTokens[oDs[ii].contract.toLowerCase()].decimals = 5;

                                var deci = 5;
                            }

                            if (oDs[ii].tranTo == 0 && oDs[ii].state == 'pending') {

                                //this is a buy order
                                oDs[ii].type = 'buy';
                                     
                                //if((allTokens['eth'].balance / Math.pow(10, allTokens['eth'].decimals)*baseX*baseConv)>(parseFloat(oDs[ii].amount) * parseFloat(oDs[ii].rate)).toFixed(2)  || getBitsWinOpt('cid').toLowerCase()=='eth'){
                                var bAc = '<a id="oid-act-' + oDs[ii].id + '" class=" waves-effect waves-light btn modal-trigger" href="#tradeOrder" oid="' + oDs[ii].id + '" act="buy">BUY</a>';
                                
                                //   }else {
                               //         var bAc = '<a id="oid-act-' + oDs[ii].id + '" class="waves-effect waves-light btn modal-trigger" href="#tradeOrder" disabled>BUY</a>';
                               
                                //}
                                 if (parseInt(oDs[ii].tranFrom.uid) == parseInt(localStorage.getItem('bits-user-name'))) {
                                    myOrdCount++;
                                    try {

                                        //allTokens[oDs[ii].coin].exchange = allTokens[oDs[ii].coin].exchange + ((oDs[ii].amount * Math.pow(10, allTokens[oDs[ii].coin].decimals)) * 2);

                                        allTokens[oDs[ii].contract].exchange = allTokens[oDs[ii].contract].exchange + (oDs[ii].amount * 2);

                                    } catch (er) {
                                        console.log('INFO! unable to update exchange balance. is wallet locked? ', er);
                                    }

                                    var bAc = '<a id="oid-act-' + oDs[ii].id + '" class="waves-effect waves-light btn modal-trigger" href="#tradeOrder" disabled>BUY</a>';
                                }
                               


                                console.log('THIS  THIS  THIS 3', oDs[ii]);
                                $("#orderbookSep").before('<tr class="element-' + oDs[ii].contract.toLowerCase() + '-coin element-all-coin" style="background-color:#ffdcdc;height: 40px;" >' +
                                    '<td ><img src="' + oDs[ii].tranFrom.icon + '" style="width: 35px;float: left;border-radius: 50px;position: relative;left: 10px;"><span class="odbk-txt hide-on-med-and-down">' + oDs[ii].tranFrom.name + '</span></td>' +
                                    '<td class="hidden-xs">' + Math.round10(parseFloat(oDs[ii].amount), (deci / -1)) + '</td>' +
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
                                    try {
                                        var coinba = allTokens[activeCoin.toLowerCase()].balance/Math.pow(10, allTokens[activeCoin.toLowerCase()].decimals)*allTokens[activeCoin.toLowerCase()].rate*baseX*baseConv;
                                    } catch (er) {

                                        var coinba = 0;
                                        console.log('INFO! unable to update exchange balance. is wallet locked? ', er);
                                    }

                                    try {
                                        //before enabling selling ensure user has sufficient funds fo cover transaction fees
                                        // TO-DO -  better workaround??
                                        // this is a rough estimatee of 10% of users balance
                                        if ((coinba*0.9) > (parseFloat(oDs[ii].amount) * parseFloat(oDs[ii].rate)).toFixed(2)) {
                                            var bAc = '<a id="oid-act-' + oDs[ii].id + '"  class="waves-effect waves-light btn modal-trigger" href="#tradeOrder" oid="' + oDs[ii].id + '" act="sell" disabled>SELL</a>';

                                        } else {
                                            var bAc = '<a id="oid-act-' + oDs[ii].id + '"  class="waves-effect waves-light btn modal-trigger" href="#tradeOrder" oid="' + oDs[ii].id + '" act="sell" >SELL</a>';

                                        }
                                    } catch (err) {
                                        var bAc = '<a id="oid-act-' + oDs[ii].id + '"  class="waves-effect waves-light btn modal-trigger" href="#tradeOrder" oid="' + oDs[ii].id + '" act="sell" disabled>SELL</a>';

                                    }

                                }


                                $("#orderbookSep").after('<tr class="element-' + oDs[ii].contract.toLowerCase() + '-coin element-all-coin" style="background-color:#dcffdc;height: 40px;">' +
                                    '<td ><img src="' + oDs[ii].tranTo.icon + '" style="width: 35px;float: left;border-radius: 50px;position: relative;left: 10px;"><span class="odbk-txt hide-on-med-and-down">' + oDs[ii].tranTo.name + '</span></td>' +
                                    '<td class="hidden-xs">' + Math.round10(parseFloat(oDs[ii].amount), (deci / -1)) + '</td>' +
                                    '<td class="hidden-xs">' + parseFloat(oDs[ii].rate).toFixed(5) + '</td>' +
                                    '<td>' + (parseFloat(oDs[ii].amount) * parseFloat(oDs[ii].rate)).toFixed(2) + '</td>' +
                                    '<td>' + bAc +
                                    '</td></tr>');




                            }

                            if (oDs[ii].trading == 'true') {
                                $("#oid-act-" + oDs[ii].id).html('trading');
                                $("#oid-act-" + oDs[ii].id).attr("disabled", true);

                            }


                            try {
                                $('.exchange-' + oDs[ii].contract + '-Balance').html(((allTokens[oDs[ii].contract].exchange / Math.pow(10, allTokens[oDs[ii].contract].decimals)) * (allTokens[oDs[ii].contract].rate * baseX)).toFixed(2) + ' ' + baseCd.toUpperCase());

                            } catch (err) {
                                console.log('!INFO did not update exchange balances')
                            }


                        }

                        if (myOrdCount > 4) {

                            $(".trade-new-Button").attr("disabled", true);
                        } else {

                            $(".trade-new-Button").attr("disabled", false);
                        }

                        // var tokenTab = allTokens['allTokens'];
                        // for (i = 0; i < tokenTab.length; i++) {

                        //     $('.exchange-' + tokenTab[i] + '-Balance').html(((allTokens[tokenTab[i]].exchange / Math.pow(10, allTokens[tokenTab[i]].decimals)) * (allTokens[tokenTab[i]].rate * baseX)).toFixed(2) + ' ' + baseCd.toUpperCase());
                        // }


                        $('.orderbook').animate({
                            scrollTop: $("#orderbookSep").offset().top - ($("#orderbookSep").offset().top / 2)
                        }, 1000, function () {

                            //wait for animation to complete then resolve the callback
                            resolve('orderBook updated');

                        });


                        //end for loop orders



                    }


                };

            });

        } else {
            var maker = CryptoJS.MD5(CryptoJS.MD5(localStorage.getItem('bits-user-name')).toString()).toString();

        };

    });
}
