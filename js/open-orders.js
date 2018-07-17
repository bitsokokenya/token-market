
function myOpenOrders(oDs, deci) {

    $("#myOrders").html('');
    //                     $("#myOrders").append('<tr style="background-color: #dad8d8;height: 40px;">' +
    //                         '<th></th>' +
    //                         '<th></th>' +
    //                         '<th class="hidden-xs">AMOUNT</th>' +
    //                         '<th class="hidden-xs">PRICE ' + baseCd.toUpperCase() + '</th>' +
    //                         '<th>TOTAL</th>' +
    //                         '<th></th>' +
    //                         '</tr>');



    for (var ii in oDs) {
        try {

            var deci = allTokens[oDs[ii].coin].decimals ? allTokens[oDs[ii].coin].decimals : 5;

        } catch (err) {
            //TO-DO
            //this should not be happening!!
            console.log(err);

            var deci = 5;
        }

        if (oDs[ii].state == 'pending') {

            var icon = 'edit';
        } else {

            var icon = 'attach_money';
        }

        if (parseInt(oDs[ii].tranTo.uid) == parseInt(localStorage.getItem('bits-user-name'))) {
            console.log("++++++++++++++++" + oDs[ii])
            //--------------------------------- collection BUY code ---------------------------------------------------------
            $("#myOrders").append('<ul class="collection">' + ' <li class="collection-item avatar">' + '<div class="row"> <div class="col s3"><img style="margin-top:5px;" src="/bitsAssets/images/currencies/' + oDs[ii].coin.replace('-kovan', '') + '.png" class="circle" style="height:75px;width: 75px;"></div><div class="col s7"><div style="font-size: 12px; line-height: 1.4;margin-top: 7px;"> <span class="title">BUY</span>' + '<p  class="hidden-xs">Amount: ' + Math.round10(parseFloat(oDs[ii].amount), (deci / -1)) + '</p>' + '<p  class="hidden-xs">Price:' + parseFloat(oDs[ii].rate).toFixed(5) + '</p>' + '<p>Total: ' + (parseFloat(oDs[ii].amount) * parseFloat(oDs[ii].rate)).toFixed(2) + '' + '</p></div></div><div class="col s2"><a class=" modal-trigger" href="#tradeOrder" style="padding:0 1rem" oid="' + oDs[ii].id + '" act="manage"><i class="material-icons right editOrderBtn" style="margin-top: 25px;margin-right: 20px; border: solid 1px; border-radius: 3px; padding: 5px;">' + icon + '</i></a></div></div>' +
                //'<a href="#!" class="secondary-content"><i class="material-icons"></i></a>'+
                ' </li>');


            //---------------------------------------- collection code end -------------------------------------------------

            //                             $("#myOrders").append('<tr class="">' +
            //                                 '<td><img src="/bitsAssets/images/currencies/' + oDs[ii].coin.replace('-kovan', '') + '.png" style="height:32px"></td>' +
            //                                 '<td>BUY</td>' +
            //                                 '<td class="hidden-xs">' + Math.round10(parseFloat(oDs[ii].amount), (deci / -1)) + '</td>' +
            //                                 '<td class="hidden-xs">' + parseFloat(oDs[ii].rate).toFixed(5) + '</td>' +
            //                                 '<td>' + (parseFloat(oDs[ii].amount) * parseFloat(oDs[ii].rate)).toFixed(2) + '</td>' +
            //                                 '<td><a class="waves-effect waves-light btn modal-trigger" href="#tradeOrder" style="padding:0 1rem" oid="' + oDs[ii].id + '" act="manage"><i class="material-icons right" style="margin: 0px;">' + icon + '</i></a></td>' +

            //                                 '</tr>');
        } else if (parseInt(oDs[ii].tranFrom.uid) == parseInt(localStorage.getItem('bits-user-name'))) {
            //--------------------------------- collection SELL code ---------------------------------------------------------
            $("#myOrders").append('<ul class="collection">' + ' <li class="collection-item avatar">' + '<div class="row"> <div class="col s3"><img style="margin-top:5px;" src="/bitsAssets/images/currencies/' + oDs[ii].coin.replace('-kovan', '') + '.png" class="circle" style="height:75px;width: 75px;"></div><div class="col s7"><div style="font-size: 12px; line-height: 1.4;margin-top: 7px;"> <span class="title">BUY</span>' + '<p  class="hidden-xs">Amount: ' + Math.round10(parseFloat(oDs[ii].amount), (deci / -1)) + '</p>' + '<p  class="hidden-xs">Price:' + parseFloat(oDs[ii].rate).toFixed(5) + '</p>' + '<p>Total: ' + (parseFloat(oDs[ii].amount) * parseFloat(oDs[ii].rate)).toFixed(2) + '' + '</p></div></div><div class="col s2"><a class=" modal-trigger" href="#tradeOrder" style="padding:0 1rem" oid="' + oDs[ii].id + '" act="manage"><i class="material-icons right editOrderBtn" style="margin-top: 25px;margin-right: 20px; border: solid 1px; border-radius: 3px; padding: 5px;"">' + icon + '</i></a></div></div>' +
                //'<a href="#!" class="secondary-content"><i class="material-icons"></i></a>'+
                ' </li>');


            //---------------------------------------- collection code end -------------------------------------------------
            //                             $("#myOrders").append('<tr class="">' +
            //                                 '<td><img src="/bitsAssets/images/currencies/' + oDs[ii].coin.replace('-kovan', '') + '.png" style="height:32px"></td>' +
            //                                 '<td>SELL</td>' +
            //                                 '<td class="hidden-xs">' + Math.round10(parseFloat(oDs[ii].amount), (deci / -1)) + '</td>' +
            //                                 '<td class="hidden-xs">' + parseFloat(oDs[ii].rate).toFixed(5) + '</td>' +
            //                                 '<td>' + (parseFloat(oDs[ii].amount) * parseFloat(oDs[ii].rate)).toFixed(2) + '</td>' +
            //                                 '<td><a class="waves-effect waves-light btn modal-trigger" href="#tradeOrder" style="padding:0 1rem" oid="' + oDs[ii].id + '" act="manage"><i class="material-icons right" style="margin: 0px;">' + icon + '</i></a></td>' +
            //                                 '</tr>');

        }

    }


}
