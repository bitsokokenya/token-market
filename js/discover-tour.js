


function discoverExchange(e) {


    if (sessionStorage.getItem('walletKey')) {


        if (e == 'dnb') {

            document.querySelector('.tap-target').setAttribute("data-target", "add-" + activeCoin + "-buy-button");

            newDisc = new M.FeatureDiscovery(document.querySelector('.tap-target'), {});

            newDisc.open();
        } else if (e == 'dfb') {

            document.querySelector('.tap-target').setAttribute("data-target", "newFirstBuyBut");
            $('.tap-target-title').html('best offer!');
            $('.tap-target-text').html('Your wallet does not have this token.<br> click the buy button and follow instructions');

            try {
                newDisc = new M.FeatureDiscovery(document.querySelector('.tap-target'), {});

                newDisc.open();
            } catch (err) {
                console.log('INFO: not activated buy guide', err);
            }

        }
    } else {
        //ask the user to unlock the wallet first

        try {

            document.querySelector('.tap-target').setAttribute("data-target", "toast-container");
            $('.tap-target-title').html('start here');
            $('.tap-target-text').html('click to unlock');

            newDisc = new M.FeatureDiscovery(document.querySelector('.tap-target'), {});

            newDisc.open();


        } catch (e) {


        }
    }

}
