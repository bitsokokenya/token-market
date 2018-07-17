
document.addEventListener('DOMContentLoaded',function() {
    document.querySelector('#newTradeConfirmation').oninput=function(e){orderWatch(e.target.value)};
	paySwits=document.querySelectorAll('.doTradeForm .switch')
for(var i in paySwits){
paySwits[i].onchange=function(){
	
	var pCls=this.getAttribute("class").replace(' switch','');
	console.log(this,this.target,pCls);
	switch (pCls) {
      case 'doPayEth-switch': 
		if(document.querySelector('.'+pCls.replace('-switch','')+' input').checked){
			   
            doTradeCola.open(0);
			document.querySelector('.'+pCls.replace('-switch','')).style["pointer-events"] = "all";
			   }else{
		
            doTradeCola.close(0);
			document.querySelector('.'+pCls.replace('-switch','')).style["pointer-events"] = "none";	   
			   }
      break;
         case 'doPayMM-switch': 
            	if(document.querySelector('.'+pCls.replace('-switch','')+' input').checked){
			   
            doTradeCola.open(1);
			
			document.querySelector('.'+pCls.replace('-switch','')).style["pointer-events"] = "all";
			   }else{
		
            doTradeCola.close(1);	   
			document.querySelector('.'+pCls.replace('-switch','')).style["pointer-events"] = "none";
			   }
      break;
         case 'doPaycard-switch': 
            	if(document.querySelector('.'+pCls.replace('-switch','')+' input').checked){
			   
            doTradeCola.open(2);
			
			document.querySelector('.'+pCls.replace('-switch','')).style["pointer-events"] = "all";
			   }else{
		
            doTradeCola.close(2);	
				   
			document.querySelector('.'+pCls.replace('-switch','')).style["pointer-events"] = "none";
			   }
      break;
        default:
            console.log('info! unknown payment method');
 
		} 
	
};
}
},false);



function setOrderCallbacks() {

    $(".tradeOrderFooterComplete").click(function () {
        $(this).html('<div class="preloader-wrapper active" style="padding :10px;width:25px;height:25px;"><div class="spinner-layer spinner-white-only"><div class="circle-clipper left"><div class="circle"></div></div><div class="gap-patch"><div class="circle"></div></div><div class="circle-clipper right"><div class="circle"></div></div> </div></div>');
        
                var actionid=$(this).attr("oid");
                var actionadr=$(this).attr("oadr");
        if ($(this).attr("action") == 'transfer') {
            //buy from orderbook
            console.log('transferring from wallet');

            transferTokenValue($("#newTransferConfirmation").val(), activeCoin, (parseFloat($("#newTransferAmount").val())), allTokens[activeCoin].rate).then(function (r) {
                console.log(r);
                $('#tradeOrder').modal('close');
                M.toast({
                    displayLength: 50000,
                    html: '<span >sent succesfully!</span><button class="btn-flat toast-action" ><a href="https://etherscan.io/tx/' + r + '" target="_blank" class="btn-flat green-text">verify<a></button>'
                });

            }).catch(function (e) {
                console.log(e);
                M.toast({
                    displayLength: 5000,
                    html: '<span >Error! completing previous transaction..</span>'
                });

            });

        } else if ($(this).attr("oid") == 'new') {

            if ($(this).attr("action") == 'buy') {
                
                // TO-DO 
                // enable payment using mobile money and cards, currently only eth payments are processed
                
                
var sendInFiat = $("#newTradePrice").val() * $("#newTradeAmount").val();
                
                transferTokenValue('0x7D1Ce470c95DbF3DF8a3E87DCEC63c98E567d481', 'eth', parseFloat(sendInFiat), 1).then(function (r) {


                doFetch({
                    action: 'manageTradeOrder',
                    oid: 'new',
                    do: 'buy',
                    user: localStorage.getItem('bits-user-name'),
                    amount: $("#newTradeAmount").val(),
                    coin: activeCoin,
                    rate: $("#newTradePrice").val(),
                    fiat: baseCd,
                    txHash: r
                }).then(function (e) {
                    if (e.status == 'ok') {
                        $('#tradeOrder').modal('close');
                        orderBookManager(baseX, baseCd);
                        M.toast({
                            displayLength: 5000,
                            html: '<span >Order Added! waiting for seller..</span><button class="btn-flat toast-action" ><a href="https://etherscan.io/tx/' + r + '" target="_blank" style="margin:0px;" class="btn-flat green-text">verify<a></button>'
                                });

                    }
                });

                


                }).catch(function (e) {
                    console.log(e);
                    try {

                        var toastElement = document.querySelector('#toast-container > .tran-error-toast');
                        var toastInstance = M.Toast.getInstance(toastElement);
                        toastInstance.dismiss();
                    } catch (err) {
                        console.log('!INFO: ', err);

                        M.toast({
                            displayLength: 5000,
                            classes: 'tran-error-toast',
                            html: '<span >error adding order. does your wallet have sufficient balance?</span>'
                        });
                    }

                })
            } else {

                try {

                    var toastElement = document.querySelector('#toast-container > .tran-waiting-toast');
                    var toastInstance = M.Toast.getInstance(toastElement);
                    toastInstance.dismiss();
                } catch (err) {
                    console.log('!INFO: ', err);

                    M.toast({
                        displayLength: 5000,
                        classes: 'tran-waiting-toast',
                        html: '<span >adding order, please wait..</span>'
                    });
                }

                var sendInFiat = $("#newTradePrice").val() * $("#newTradeAmount").val();
                var atPr = $("#newTradePrice").val() / baseX;

                transferTokenValue('0x7D1Ce470c95DbF3DF8a3E87DCEC63c98E567d481', activeCoin, parseInt(sendInFiat), atPr).then(function (r) {



                    doFetch({
                        action: 'manageTradeOrder',
                        oid: 'new',
                        do: 'sell',
                        user: localStorage.getItem('bits-user-name'),
                        amount: $("#newTradeAmount").val(),
                        coin: activeCoin,
                        rate: $("#newTradePrice").val(),
                        fiat: baseCd,
                        txHash: r
                    }).then(function (e) {
                        if (e.status == 'ok') {
                            $('#tradeOrder').modal('close');
                            try {

                                var toastElement = document.querySelector('#toast-container > .tran-suc-toast');
                                var toastInstance = M.Toast.getInstance(toastElement);
                                toastInstance.dismiss();
                            } catch (err) {
                                console.log('!INFO: ', err);

                                M.toast({
                                    displayLength: 5000,
                                    classes: 'tran-suc-toast',
                                    html: '<span >Order Added! waiting for buyer..</span><button class="btn-flat toast-action" ><a href="https://etherscan.io/tx/' + r + '" target="_blank" style="margin:0px;" class="btn-flat green-text">verify<a></button>'
                                });
                            }

                            orderBookManager(baseX, baseCd);
                        }
                    });



                }).catch(function (e) {
                    console.log(e);
                    try {

                        var toastElement = document.querySelector('#toast-container > .tran-error-toast');
                        var toastInstance = M.Toast.getInstance(toastElement);
                        toastInstance.dismiss();
                    } catch (err) {
                        console.log('!INFO: ', err);

                        M.toast({
                            displayLength: 5000,
                            classes: 'tran-error-toast',
                            html: '<span >error adding order. does your wallet have enough gas?</span>'
                        });
                    }

                })

            }





        } else if ($(this).attr("action") == 'buy') {
            //buy from orderbook
		if(document.querySelector('.doTradeForm>.active').getAttribute("class").replace(' active','')=='doPayEth'){
            console.log('buying from orderbook')
            
             if((allTokens['eth'].balance / Math.pow(10, allTokens['eth'].decimals)*baseX*baseConv)>parseFloat($("#newTradeTotal").val())){         
            try {

                    var toastElement = document.querySelector('#toast-container > .tran-waiting-toast');
                    var toastInstance = M.Toast.getInstance(toastElement);
                    toastInstance.dismiss();
                } catch (err) {
                    console.log('!INFO: ', err);

                    M.toast({
                        displayLength: 5000,
                        classes: 'tran-waiting-toast',
                        html: '<span >adding order, please wait..</span>'
                    });
                }

                
                transferTokenValue(actionadr, 'eth', parseFloat($("#newTradeTotal").val()), 1).then(function (r,e) {

                    console.log(r,e);

                    doFetch({
                        action: 'manageTradeOrder',
                        oid:  actionid,
                        do: 'buy',
                        user: localStorage.getItem('bits-user-name'),
                        txHash: r
                    }).then(function (e) {
                        if (e.status == 'ok') {
                            $('#tradeOrder').modal('close');
                            try {

                                var toastElement = document.querySelector('#toast-container > .tran-suc-toast');
                                var toastInstance = M.Toast.getInstance(toastElement);
                                toastInstance.dismiss();
                            } catch (err) {
                                console.log('!INFO: ', err);

                                M.toast({
                                    displayLength: 50000,
                                    classes: 'tran-suc-toast',
                                    html: '<span >Sent! Please wait for balance update..</span><button class="btn-flat toast-action" ><a href="https://etherscan.io/tx/' + r + '" target="_blank" style="margin:0px;" class="btn-flat green-text">verify<a></button>'
                                });
                            }

                            orderBookManager(baseX, baseCd);
                        }
                    });



                }).catch(function (e) {
                    console.log(e);
                    try {

                        var toastElement = document.querySelector('#toast-container > .tran-error-toast');
                        var toastInstance = M.Toast.getInstance(toastElement);
                        toastInstance.dismiss();
                    } catch (err) {
                        console.log('!INFO: ', err);

                        M.toast({
                            displayLength: 5000,
                            classes: 'tran-error-toast',
                            html: '<span >Error! completing previous transaction..</span>'
                        });
                    }

                })
}else{
    
                $('#tradeOrder').modal('close');
    
     M.toast({
                    displayLength: 5000,
                            classes: 'tran-error-toast',
                    html: '<span >insufficient funds!</span><button class="btn-flat toast-action" ><a href="/tm/?cid=eth" target="_blank" class="btn-flat green-text">topup<a></button>'
                });
    
}
}else if(document.querySelector('.doTradeForm>.active').getAttribute("class").replace(' active','')=='doPayMM'){
//buy this using mobile money transaction code
	
	
	
	
	
}
        } else if ($(this).attr("action") == 'sell') {
            //selling from orderbook
            
            console.log('selling from orderbook')
   if(allTokens[activeCoin.toLowerCase()].balance / Math.pow(10, allTokens[activeCoin.toLowerCase()].decimals)>parseFloat($("#newTradeAmount").val())){         
            try {

                    var toastElement = document.querySelector('#toast-container > .tran-waiting-toast');
                    var toastInstance = M.Toast.getInstance(toastElement);
                    toastInstance.dismiss();
                } catch (err) {
                    console.log('!INFO: ', err);

                    M.toast({
                        displayLength: 5000,
                        classes: 'tran-waiting-toast',
                        html: '<span >adding order, please wait..</span>'
                    });
                }

                var sendInFiat = $("#newTradePrice").val() * $("#newTradeAmount").val();
                var atPr = $("#newTradePrice").val() / baseX;

                transferTokenValue(actionadr, activeCoin, (parseFloat(sendInFiat)), atPr).then(function (r,e) {

                    console.log(r,e);

                    doFetch({
                        action: 'manageTradeOrder',
                        oid:  actionid,
                        do: 'sell',
                        user: localStorage.getItem('bits-user-name'),
                        txHash: r
                    }).then(function (e) {
                        if (e.status == 'ok') {
                            $('#tradeOrder').modal('close');
                            try {

                                var toastElement = document.querySelector('#toast-container > .tran-suc-toast');
                                var toastInstance = M.Toast.getInstance(toastElement);
                                toastInstance.dismiss();
                            } catch (err) {
                                console.log('!INFO: ', err);

                                M.toast({
                                    displayLength: 50000,
                                    classes: 'tran-suc-toast',
                                    html: '<span >Sent! Please wait for balance update..</span><button class="btn-flat toast-action" ><a href="https://etherscan.io/tx/' + r + '" target="_blank" style="margin:0px;" class="btn-flat green-text">verify<a></button>'
                                });
                            }

                            orderBookManager(baseX, baseCd);
                        }
                    });



                }).catch(function (e) {
                    console.log(e);
                    try {

                        var toastElement = document.querySelector('#toast-container > .tran-error-toast');
                        var toastInstance = M.Toast.getInstance(toastElement);
                        toastInstance.dismiss();
                    } catch (err) {
                        console.log('!INFO: ', err);

                        M.toast({
                            displayLength: 5000,
                            classes: 'tran-error-toast',
                            html: '<span >Error! completing previous transaction..</span>'
                        });
                    }

                })
}else{
    
                $('#tradeOrder').modal('close');
 M.toast({
                            displayLength: 3000,
                            classes: 'tran-error-toast',
                            html: '<span >insufficient funds</span>'
                        });
    
}
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
                    M.toast({
                        displayLength: 5000,
                        html: '<span >order modified! waiting for seller..</span>'
                    });

                } else {
                    M.toast({
                        displayLength: 5000,
                        html: '<span >order not modified!</span>'
                    });

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
                M.toast({
                    displayLength: 5000,
                    html: '<span >order cancelled!</span>'
                });

            }
        });



    });

}
