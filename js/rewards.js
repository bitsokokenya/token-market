//Fetch rate
var finalRate;
var cKobo = "";
var xKobo = "";
var baseX;
var baseCd;
var deliveryGuys;

function openOrder(oid, act) {
    $("#newTradeTotal").val('')
    $("#newTransferTotal").val('');
    $("#newTransferAmount").val('');
    $("#newTransferPrice").val('');

    // Callback for Modal open. Modal and trigger parameters available.
    tradeManager(oid, act);

}

function walletStatus() {
    if (sessionStorage.getItem('walletKey')) {
        return true;
    } else {
        loadGdrive()
    }
}

function upDtokenD() {
    if (allTokens[activeCoin.toLowerCase()].balance / Math.pow(10, allTokens[activeCoin.toLowerCase()].decimals) < 1000) {
        buyTokensUsingMobileMoney();
    } else {
        $('.coindata-' + activeCoin.toLowerCase() + '-wpage').attr('href', allTokens[activeCoin.toLowerCase()].webpage.toLowerCase());
        $('.coindata-' + activeCoin.toLowerCase() + '-wpage').html(allTokens[activeCoin.toLowerCase()].webpage.toLowerCase());
        $('.coindata-' + activeCoin.toLowerCase() + '-mcap').html(numberify(((allTokens[activeCoin.toLowerCase()].rate * baseX) * allTokens[activeCoin.toLowerCase()].supply)) + ' ' + baseCd.toUpperCase());
        $('.coindata-' + activeCoin.toLowerCase() + '-price').html(numberify(allTokens[activeCoin.toLowerCase()].rate * baseX, 2) + ' ' + baseCd.toUpperCase());
        //console.log(allTokens[activeCoin.toLowerCase()].balance, Math.pow(10, allTokens[activeCoin.toLowerCase()].decimals), allTokens[activeCoin.toLowerCase()].rate, baseX, baseCd.toUpperCase());
        var thBal = numberify((allTokens[activeCoin.toLowerCase()].balance / Math.pow(10, allTokens[activeCoin.toLowerCase()].decimals) * allTokens[activeCoin.toLowerCase()].rate * baseX), 2);
        $('.tokens-' + activeCoin.toLowerCase() + '-Balance').html('').append(allTokens[activeCoin.toLowerCase()].balance / Math.pow(10, allTokens[activeCoin.toLowerCase()].decimals) + ' ' + allTokens[activeCoin.toLowerCase()].name);
        $('.wallet-' + activeCoin.toLowerCase() + '-Balance').html('').append(thBal + ' ' + baseCd.toUpperCase());
        if (parseFloat(thBal) > 0) {
            $(".new-trade-buy-Button").attr("disabled", false);
            $(".new-trade-sell-Button").attr("disabled", false);
        } else {
            $(".new-trade-buy-Button").attr("disabled", true);
            $(".new-trade-sell-Button").attr("disabled", true);
        }

        sortOrderBookColor();
        document.getElementById("getEthBal").innerHTML = ((allTokens["eth"].balance / Math.pow(10, 18)) * baseX * baseConv).toFixed(2) + ' ' + baseCd.toUpperCase();

        setInterval(function() {
            document.getElementById("getEthBal").innerHTML = ((allTokens["eth"].balance / Math.pow(10, 18)) * baseX * baseConv).toFixed(2) + ' ' + baseCd.toUpperCase();
        }, 20000)
    }
}

function doFirstBuy() {

    // start first transaction
    try {

        $("#newFirstBuy").attr('id', 'notNewFirstBuy');
        $("#newFirstBuyBut").attr('id', 'notNewFirstBuyBut');
        $($("#orderbookSep").prevAll("tr.element-" + activeCoin.toLowerCase() + "-coin")[0]).attr('id', 'newFirstBuy');

        $("#newFirstBuy td:last-child").attr('id', 'newFirstBuyBut')

        if (allTokens[activeCoin.toLowerCase()].balance == 0) {
            window.setTimeout(function() {

                discoverExchange('dfb');
                window.setTimeout(function() {

                    discoverExchange('dfb');
                }, 200);
            }, 200);
        }

    } catch (er) {
        M.toast({
            displayLength: 1000000000,
            html: '<span class="toastlogin">your wallet is locked</span><button id="toast-wallet-unlocker" onclick="loadGdrive()" class="btn-flat toast-action" ><span id="toast-wallet-unlocker-sp" style="pointer-events:none;" class="toastloginbutton">Unlock</span></button>'
        });

        console.log('INFO! not started firstbuy, is wallet locked? ', er)
    }

}

function orderWatch(cod) {
    if (cod.length > 0) {
        doFetch({
            action: 'orderWatcher',
            oid: $('.tradeOrderFooterComplete').attr("oid"),
            user: localStorage.getItem('bits-user-name'),
            orderRef: cod
        }).then(function(e) {
            if (e.status == 'ok') {

                $(".tradeOrderFooterCancel").html("dispute");
                $(".tradeOrderFooterCancel").attr("action", "dispute");

                $(".transStat").html(e.msg);
                M.toast({
                    displayLength: 5000,
                    html: '<span class="toastlogin">order confirmed! completing trade</span>'
                });


            } else {

                $(".transStat").html(e.msg);
                M.toast({
                    displayLength: 2000,
                    html: '<span class="toastlogin">waiting for seller to confirm</span>'
                });

            }
        });

    } else {

        M.toast({
            displayLength: 2000,
            html: '<span class="toastlogin">enter transaction code</span>'
        });
    }



}


function refreshOrderBook() {

    orderBookManager(baseX, baseCd).then(function(e) {


        getAvailableCoins();

    });



}

function stopOrderWatch() {
    try {
        clearInterval(orderTimer);
    } catch (e) {
        console.log(e);
    }
}
started = false;
statInt = setInterval(function() {
    if (!started) {
        starting();
    }

}, 450)

function starting() {

    started = true;
    //bad hack fix, sometimes the ready callbacks are not working :?{
    clearInterval(statInt);
    //user wants to trade so hide default landing page
    if (getBitsWinOpt('uid') || getBitsWinOpt('cid')) $("#tokenSelect").hide();
    walletFunctions(localStorage.getItem('bits-user-name')).then(function(u) {

        new M.Modal(document.querySelector('#userAccount'), {
            ready: function(e) {
                showAddr('0x' + localStorage.getItem('bits-user-address-' + localStorage.getItem('bits-user-name')));

                if (localStorage.getItem('bits-user-address-' + localStorage.getItem('bits-user-name'))) {

                    var adr = '0x' + localStorage.getItem('bits-user-address-' + localStorage.getItem('bits-user-name'));
                } else {
                    var adr = 'wallet locked';

                }

                $(".userWalletAddress").html(adr);
            }
        });
        var newDisc;



        /////////////////////////////////// start update exchange rates

        fetchRates().then(function(e) {
            /*
            if (e.status == "ok") {
                coinList = e.data.data;
                var rate = coinList[0].coinRate;
                var bankCharges = 5; // %
                baseX = e.data.baseEx;
                baseCd = e.data.baseCd;
                finalRate = rate * (e.data.baseEx + ((e.data.baseEx * bankCharges) / 100)); //inclusive bank charges



                $("#fetchedRate").html(finalRate.toFixed(2));
                */
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

            orderBookManager(e.baseEx, e.baseCd).then(function(e) {


                getAvailableCoins();
                sortOrderBookColor();


                $('#tradeOrder').modal({
                    dismissible: true, // Modal can be dismissed by clicking outside of the modal
                    opacity: .5, // Opacity of modal background
                    inDuration: 300, // Transition in duration
                    outDuration: 200, // Ending top style attribute
                    ready: function(modal, trigger) {

                        console.log($(trigger).attr('oid'), $(trigger).attr('act'));
                        if (!getBitsOpt('oid') || !getBitsOpt('act')) {

                            openOrder($(trigger).attr('oid'), $(trigger).attr('act'));
                        } else {

                            location.hash = '';

                        }
                        setTimeout(function() {
                            M.updateTextFields();
                        }, 600);
                        walletStatus();
                    },
                    complete: function() {
                        stopOrderWatch()
                    } // Callback for Modal close
                });

                //start push messaging
                try {

                    startPushManager();
                } catch (er) {
                    console.log('INFO! not started messaging ', er)
                }

                //set interval to update token balance;
                setInterval(function() {
                    upDtokenD();
                }, 10000);

                // start first transaction
                doFirstBuy();



                if (getBitsOpt('oid')) {
                    // start open requested order
                    openOrder(getBitsOpt('oid'), 'manage');
                    // end open requested order

                } else if (getBitsOpt('act') == 'transfer') {

                    openOrder('new', 'transfer');

                    $("#newTransferConfirmation").val(getBitsOpt('dest'));

                    $("#newTransferAmount").val(getBitsOpt('amount'));

                }




            });



            // } else {
            //    console.log("error");
            // }
        });

        ///////////////////////////// end update exchange rates//////////////////////////////////////////////////////////////////////

    }).catch(function(err) {

        console.log('!info ', err)
        setTimeout(function() {
            starting();
        }, 450);
    })
    profileImg();

    matchAddrUser();

    $(".newTransferForm").on('change', '#newTransferConfirmation', function(e) {
        var selectedUser = $("#newTransferConfirmation").val();
        console.log(selectedUser)
        for (var i in deliveryGuys) {
            var name = deliveryGuys[i].name;
            var id = deliveryGuys[i].id;
            var walletAdress = deliveryGuys[i].wallets;
            if (selectedUser == name) {
                $("#newTransferConfirmation").val("0x" + JSON.parse(walletAdress.replace('"[', '[').replace(']"', ']')).publicAddress[0]);
            }
        }
    })
}

function getAvailableCoins() {
    var ownerTab = allTokens['ownerTokens'];


    if (getBitsWinOpt('uid')) {
        var tokenTab = makerTokens;
    } else if (getBitsWinOpt('cid')) {
        var tokenTab = [];
        tokenTab.push(getBitsWinOpt('cid').toLowerCase());
    } // else {
    //   var tokenTab = allTokens['balanceTokens'];
    // };


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

    if (getBitsWinOpt('uid') != undefined) {


        activeCoin = tokenTab[0];

    }

    var uscoin = getBitsOpt('coin');

    if (getBitsWinOpt('cid') != undefined) {

        // TO-DO remove support for calling contracts by name
        activeCoin = getBitsWinOpt('cid').toLowerCase();

        var uscoin = undefined;

    }

    if (uscoin != undefined) {

        activeCoin = allTokens[getBitsOpt('coin')].contract;
        var index = tokenTab.indexOf(activeCoin);
        if (index > -1) {
            tokenTab.splice(index, 1);

        }
        tokenTab.unshift(getBitsOpt('coin'));

    }



    for (i = 0; i < tokenTab.length; i++) {

        $(".coinTab").html('').append('<li class="tab col s2" style="width: calc(100% / ' + tokenTab.length + ')!important;"><a href="#' + tokenTab[i] + '" style="color:#bbbaba;position: relative;padding: 0 35px 0px 35px;"><img src="/bitsAssets/images/currencies/' + allTokens[tokenTab[i].toLowerCase()].name.replace('-kovan', '') + '.png" style="width: 30px; position: absolute;top: 10px;left:5%!important;"> 1 ' + allTokens[tokenTab[i].toLowerCase()].name + ' = <span class="coindata-' + tokenTab[i].toLowerCase() + '-price">updating..</span><img src="/bitsAssets/images/flags/' + baseFl + '.png" style="width: 30px; position: absolute;top: 10px;right:5%!important;"></a></li>')
        $(".availableCoins").html('').append('<li style="cursor: pointer;"><a coin="' + tokenTab[i] + '"><img style="width: 60px; border-radius: 50%;" src="/bitsAssets/images/currencies/' + allTokens[tokenTab[i].toLowerCase()].name + '.png"><p style="margin: 0; color: white; text-transform: uppercase;">' + allTokens[tokenTab[i].toLowerCase()].name + '</p></a></li>')
        $(".coinContent").html('').append('<div id="' + tokenTab[i] + '" class="col s12 hero" style="font-size: 2em;text-transform: uppercase; color: white; line-height: 850%; display: block; margin-top: -45px;height: 250px;"><div class="row col s5"> <div class="col s12 m12 coinDataHolda"><div class="row"><div class="col s4"><img style="width: 90px;border-radius: 50%;margin-right: -10px;top: 30px;position: relative;" src="/bitsAssets/images/currencies/' + allTokens[tokenTab[i].toLowerCase()].name.replace('-kovan', '') + '.png"></div><div class="col s8"><p style=" margin: 0px;"><span style=" border-left: solid white 15px; margin-right: 20px;"></span>' + allTokens[tokenTab[i].toLowerCase()].name + '</p></div></div></div>' +
            '</div><div class="col s12 m6 doTransActs" style="text-align: center; position: relative;padding: 0px;">' +
            '<table class="striped bordered buySell" id="blocks" style="line-height: 20px;width: 50%;float:left;display: block;margin-left: auto;margin-right: auto;background-color: transparent!important;font-size: 14px;">' +
            '<tbody style="height: 350px;"><tr><th style="padding: 0% 0% 5% 0%;text-transform:uppercase;">Balance</th></tr><tr><th class="tokens-' + tokenTab[i].toLowerCase() + '-Balance" style="text-align: right;">' +
            '<div class="preloader-wrapper active" style="width:15px;height:15px;"><div class="spinner-layer spinner-white-only"><div class="circle-clipper left"><div class="circle"></div></div><div class="gap-patch"><div class="circle"></div>' +
            '</div><div class="circle-clipper right"><div class="circle"></div></div> </div></div></th></tr>' +
            '<tr><th class="wallet-' + tokenTab[i].toLowerCase() + '-Balance" style="text-align: right;">' +
            '<div class="preloader-wrapper active" style="width:15px;height:15px;"><div class="spinner-layer spinner-white-only"><div class="circle-clipper left"><div class="circle"></div></div><div class="gap-patch"><div class="circle"></div>' +
            '</div><div class="circle-clipper right"><div class="circle"></div></div> </div></div></th></tr><tr>' +
            '<tr><th></th><th></th></tr>' +
            '</tr></tbody></table><div class="row"><table class="striped trnsf" id="blocks" style="line-height: 20px;width: 50%;float:right;font-size: 14px;background-color: transparent!important;display: block;margin-left: auto;margin-right: auto;display: block;"><tbody style="display: block;">' +
            '<tr style=" display: block;"><th style=" display: block;"><a id="add-' + tokenTab[i] + '-buy-button" class="new-trade-buy-Button trade-new-Button waves-effect waves-light btn modal-trigger" href="#tradeOrder" style="width: calc(50% - 3px);margin-right:2.5px; position:relative; overflow:initial;" oid="new" act="buy" disabled onlick="walletStatus()"><i class="material-icons left" style="margin: 0px;">file_download</i>BUY</a>' +
            '<a class="trade-' + tokenTab[i] + '-Button new-trade-sell-Button trade-new-Button waves-effect waves-light btn modal-trigger" href="#tradeOrder" style="width: calc(50% - 3px);margin-left:2.5px;  position:relative;" oid="new" act="sell" onlick="walletStatus()"><i class="material-icons right" style="margin: 0px;">file_upload</i>SELL</a></th></tr>' +
            '<tr style=" display: block;"><td  style=" display: block;padding: 5px 0px;"><div class="popup transferTour" style=" position: absolute; z-index: 10; bottom: -410%; display:none;"> <span class="transferPopupText" id="myPopup" style=""><p style=" font-weight: 500; text-transform: initial; padding: 10px;">Transfer to a different ethereum address. Fees will be included in transfer amount.</p><div class="modal-footer"> <a href="#!" class="modal-action modal-close waves-effect waves-green btn-flat openOrderBookTour" style=" float: right;">next</a> </div></span></div><a class="transfer-' + tokenTab[i] + '-Button waves-effect waves-light btn modal-trigger red" href="#tradeOrder" style="width: 100%;" oid="new" act="transfer" onlick="walletStatus()"><i class="material-icons right">redo</i>Transfer</a></td>' +
            '</tr></tbody></table></div></div></div></div>');

        // $('ul.tabs').tabs('select_tab', 'tab_id');
        //        $('ul.tabs').tabs();
        try {
            if (allTokens[tokenTab[i]].balance > 0) {
                $('.trade-' + tokenTab[i] + '-Button').attr('disabled', false)
            } else {
                $('.trade-' + tokenTab[i] + '-Button').attr('disabled', true)
            }

        } catch (err) {
            // probably the users wallets are unloaded/locked
            console.log(err);
        }


    }



    $(".activeCoin").text(activeCoin)
    $(document).on("click", ".coinTab li a", function() {
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

        fetchRates().then(function(e) {
            if (e.status == "ok") {
                upDtokenD();
                doFirstBuy();
                sortOrderBookColor();

            } else {
                console.log("error");
            }

        });

    });

    doFetch({
        action: 'userVerified',
        uid: localStorage.getItem("bits-user-name")
    }).then(function(e) {
        if (e.status == "ok") {} else if (e.status == "bad") {
            $(".MobileModal").modal("open")
        } else {
            $(".MobileModal").modal("open")
        }
    })
}


function getTradableCoins() {


    fetchRates().then(function(e) {
        var tTab = allTokens['allTokens'];
        if (getBitsWinOpt('cid') != undefined) {

            var tTab = makerTokens;

        }

        for (i = 0; i < tTab.length; i++) {

            if (allTokens[tTab[i]].chain != 'eth') {
                continue;
            }


            if (tTab[i].toLowerCase() != getBitsWinOpt('cid').toLowerCase()) {
                continue;
            }

            $(".tradableCoins").append(' <li class="collection-item avatar" style=" background: rgba(255, 255, 255, 0.7686274509803922);margin: 10px; height: 60px; min-height: 60px;">' +
                '<img src="/bitsAssets/images/currencies/' + tTab[i] + '.png" alt="" class="circle">' +
                '<span class="title">' + allTokens[tTab[i]].fullname + '</span>' +
                '<p>' + (allTokens[tTab[i]].rate * baseX).toFixed(2) + ' ' + baseCd.toUpperCase() + '</p>' +
                '<a href="#!" class="secondary-content"><i class="material-icons">trending_up</i></a>' +
                '</li>')

        }

    });





}







//Enable Loyalty
$('.loyaltyCls').click(function() {
    $('#loyaltyModal').modal('close');
});

//const payButton = document.getElementById('buy100');

//payButton.setAttribute('style', 'display: none;');

$(document).on("click", "#rewardsPage", function() {
    $(".navbar-color").css("box-shadow", "none");
});


//Clear Local Storage
$("#reload").click(function() {
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
$('#startTour').click(function() {
    var buyTour = $(".buyTour");
    var ctr = 1;
    buyTour.className = buyTour.className !== 'show' ? 'show' : 'hide';
    if (buyTour.className === 'show') {
        buyTour.css("display", "block");
        window.setTimeout(function() {
            buyTour.css("opacity", "1");
            buyTour.css("transform", "scale(1)");
        }, 0);
    }
    $(".transferTour").css("opacity", "0");
    $(".transferTour").css("transform", "scale(0)");
    window.setTimeout(function() {
        $(".transferTour").css("display", "none");
    }, 700);
    $(".sellTour").css("transform", "scale(0)");
    window.setTimeout(function() {
        $(".sellTour").css("display", "none");
    }, 700);
    $(".orderBookTour").css("opacity", "0");
    $(".orderBookTour").css("transform", "scale(0)");
    window.setTimeout(function() {
        $(".orderBookTour").css("display", "none");
    }, 700);
    $(".myOrdersTour").css("opacity", "0");
    $(".myOrdersTour").css("transform", "scale(0)");
    window.setTimeout(function() {
        $(".myOrdersTour").css("display", "none");
    }, 700);
})
$(document).on('touchstart click', '.openSellTour', function(event) {
    $(".buyTour").css("opacity", "0");
    $(".buyTour").css("transform", "scale(0)");
    window.setTimeout(function() {
        $(".buyTour").css("display", "none");
    }, 700);

    $(".sellTour").css("display", "block");
    window.setTimeout(function() {
        $(".sellTour").css("opacity", "1");
        $(".sellTour").css("transform", "scale(1)");
    }, 0);
});
$(document).on('touchstart click', '.openTransferTour', function(event) {
    $(".sellTour").css("opacity", "0");
    $(".sellTour").css("transform", "scale(0)");
    window.setTimeout(function() {
        $(".sellTour").css("display", "none");
    }, 700);
    $(".transferTour").css("display", "block");
    window.setTimeout(function() {
        $(".transferTour").css("opacity", "1");
        $(".transferTour").css("transform", "scale(1)");
    }, 0);
});
$(document).on('touchstart click', '.openOrderBookTour', function(event) {
    $(".transferTour").css("opacity", "0");
    $(".transferTour").css("transform", "scale(0)");
    window.setTimeout(function() {
        $(".transferTour").css("display", "none");
    }, 700);
    $(".orderBookTour").css("display", "block");
    window.setTimeout(function() {
        $(".orderBookTour").css("opacity", "1");
        $(".orderBookTour").css("transform", "scale(1)");
    }, 0);
});
$(document).on('touchstart click', '.openMyOrderTour', function(event) {
    $(".orderBookTour").css("opacity", "0");
    $(".orderBookTour").css("transform", "scale(0)");
    window.setTimeout(function() {
        $(".orderBookTour").css("display", "none");
    }, 700);
    $(".myOrdersTour").css("display", "block");
    window.setTimeout(function() {
        $(".myOrdersTour").css("opacity", "1");
        $(".myOrdersTour").css("transform", "scale(1)");
    }, 0);
});
$(document).on('touchstart click', '.finishTour', function(event) {
    $(".myOrdersTour").css("opacity", "0");
    $(".myOrdersTour").css("transform", "scale(0)");
    window.setTimeout(function() {
        $(".myOrdersTour").css("display", "none");
    }, 700);
});



//Get Profile Image
function profileImg() {
    var userId = localStorage.getItem("bits-user-name")
    getObjectStore('data', 'readwrite').get("user-profile-" + userId + "").onsuccess = function(event) {
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





//Buy Store Tokens
$("#tokenPrice").click(function() {
    var tokenValue = $("#tokenVal").val();
    if (tokenValue == "") {
        M.toast({
            html: 'Ooops! Please input amount',
            displayLength: 3000
        })
    } else {
        transferTokenValue("0x7D1Ce470c95DbF3DF8a3E87DCEC63c98E567d481", "0xb72627650f1149ea5e54834b2f468e5d430e67bf", parseFloat(tokenValue), allTokens["0xb72627650f1149ea5e54834b2f468e5d430e67bf"].rate).then(function(r) {
            console.log("This is the TRID" + r);
            doFetch({
                action: "payOrderEth",
                contract: "0xb72627650f1149ea5e54834b2f468e5d430e67bf",
                amount: tokenValue / (baseX * allTokens["0xb72627650f1149ea5e54834b2f468e5d430e67bf"].rate),
                rate: baseX * allTokens["0xb72627650f1149ea5e54834b2f468e5d430e67bf"].rate,
                user: localStorage.getItem("soko-owner-id"),
                baseCd: baseCd,
                shop: localStorage.getItem("soko-active-store"),
                tran: r
            }).then(function(e) {
                if (e.status == 'ok') {
                    $(".prodCatToast").remove();
                    M.toast({
                        html: 'Tokens bought successfully',
                        classes: 'prodCatToast',
                        displayLength: 3000
                    })
                } else {
                    M.toast({
                        html: 'Error! Please try later',
                        displayLength: 3000
                    })
                }
            });
        });
    }
});



//Match Adress with user
function matchAddrUser() {
    var inputVal = $("#newTransferConfirmation").val();
    doFetch({
        action: 'getAllUsers',
        data: inputVal
    }).then(function(e) {
        var dat = {}
        deliveryGuys = e.users;

        for (var iii in e.users) {
            var nm = e.users[iii].name;
            var icn = e.users[iii].icon;
            //var id = e.users[iii].id;
            dat[nm] = icn;

        }

        $("#newTransferConfirmation").keyup(function() {
            var textCounter = $(this).val().length;
            var inputVal = $("#newTransferConfirmation").val();
            if (textCounter >= 3) {} else {
                $("#newTransferConfirmation").autocomplete({
                    data: dat
                });
            }
        });


    });
}

//Select wallet
$(document).on("click", ".selectedWallet", function(e) {
    $(this).html('<div class="preloader-wrapper active" style="width: 20px; height: 20px; margin: 5px 15px;"> <div class="spinner-layer spinner-blue-only"> <div class="circle-clipper left"> <div class="circle"></div></div><div class="gap-patch"> <div class="circle"></div></div><div class="circle-clipper right"> <div class="circle"></div></div></div></div>')
})

//Buy tokens using mobile money to access token market
function buyTokensUsingMobileMoney() {
    $('#buyTokensWindow').css('display', 'block')
    var amount = $('#tokenPurchaseInput').val()

    $('#tokenPurchaseBtn').click(function(e) {
        if (amount == '') {
            M.toast({
                html: 'Please enter amount'
            })
        } else {
            doFetch({
                action: 'getInsufficientFundsOrderbook',
                contract: "0xb72627650f1149ea5e54834b2f468e5d430e67bf",
                rate: allTokens["0xb72627650f1149ea5e54834b2f468e5d430e67bf"].rate * baseX,
                total: amount,
                act: 'buy',
                countryCode: baseCd
            }).then(function(e) {
                if (e.status == "ok") {
                    document.getElementById("insufficientFundsModal").style.display = "block";
                    insufficientOrderNum = e.data.num;
                    return insufficientOrderNum;
                } else {
                    M.toast({
                        html: "Unable to complete transaction"
                    });
                    clearCart();
                }
            });
        }
    })

}
