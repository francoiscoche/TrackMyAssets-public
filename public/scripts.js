(function ($) {

    toastr.options = {
        "closeButton": false,
        "debug": false,
        "newestOnTop": false,
        "progressBar": false,
        "positionClass": "toast-top-center",
        "preventDuplicates": false,
        "onclick": null,
        "showDuration": "300",
        "hideDuration": "100",
        "timeOut": "1600",
        "extendedTimeOut": "100",
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "fadeIn",
        "hideMethod": "fadeOut"
    }
    $(document).on('change', '.plateform-dropdown', function () {
        // Pure JS
        var selectedVal = this.value;

        if (selectedVal === 'opensea' || selectedVal === 'magiceden') {
            $("#label-collection-name").text('Collection Name:');
        } else if (selectedVal === 'looksrare') {
            $("#label-collection-name").text('Contract adress');
        }
        $('#input-collection-name').show("slow");
    });
    $("#contract-or-name-dropdown").on("change", function () {

        var selectedVal = $('.contract-or-name-dropdown').find(":selected").val();

        if (selectedVal === 'collection_name') {
            $("#label-collection-name").text('Collection Name');
        } else {
            $("#label-collection-name").text('Contract adress');
        }
        $('#input-collection-name').show("slow");
    });

    $(document).on('click', '.button-dashboard-copy', function () {
        /* Get the text field */
        var copyText = document.getElementById("userId");

        /* Select the text field */
        copyText.select();
        copyText.setSelectionRange(0, 99999); /* For mobile devices */

        toastr["success"]("Copied !")

        /* Copy the text inside the text field */
        navigator.clipboard.writeText(copyText.value);
    });

    $(document).on('click', '.qrcode-footer-copy', function () {
        var copyText = document.getElementById("eth-address").textContent;
        toastr["success"]("Copied !");
        navigator.clipboard.writeText(copyText);
    });

    $(document).on('click', '#btn-floor-alert', async function (e) {
        e.preventDefault();

        const collection_brut = document.querySelector("#input-collection").value;
        const collection_name = collection_brut.toLowerCase().trim();
        const plateformSelected = document.querySelector(".plateform-dropdown").value;
        const fullInput = document.querySelector('#userId').value;
        const customId = fullInput.substring(7);

        if (plateformSelected !== "" && collection_name !== "" && customId !== "") {
            $('.loader').show();
            $('#background-shadow').show();
            try {
                const res = await fetch('/submitCollection', {
                    method: 'POST',
                    body: JSON.stringify({
                        plateformSelected,
                        collection_name,
                        customId
                    }),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                const data = await res.json();
                $("#arrayFloorPrice").load(location.href + " #arrayFloorPrice");
                $('.loader').hide();
                $('#background-shadow').hide();

                if (data.type == "success") {
                    toastr["success"](data.message)
                } else {
                    toastr["error"](data.message)
                }
            } catch (err) {
                $('.loader').hide();
                $('#background-shadow').hide();
                toastr["error"](err.message)
            }
        } else {
            toastr["error"]("Please check your data");
        }
    });

    $(document).on('click', '#btn-special-floor-alert', async function (e) {
        e.preventDefault();
        const fullInput = document.querySelector('#userId').value;
        const custom_id = fullInput.substring(7);
        const collection_brut = document.querySelector("#input-collection-special").value;
        const collection_name = collection_brut.toLowerCase().trim();
        const collection_price = document.querySelector("#input-price-special").value;

        if (collection_price !== "" && collection_name !== "" && custom_id !== "") {
            $('.loader').show();
            $('#background-shadow').show();
            try {
                const res = await fetch('/submitSpecialAlert', {
                    method: 'POST',
                    body: JSON.stringify({ collection_name, collection_price, custom_id }),
                    headers: { 'Content-Type': 'application/json' }
                });

                const data = await res.json();

                $('.loader').hide();
                $('#background-shadow').hide();
                $("#table-dashboard-alert").load(location.href + " #table-dashboard-alert");
                toastr["success"](data.message);

                if (data.errors) {
                    $('.loader').hide();
                    $('#background-shadow').hide();
                    toastr["error"](data.message);
                }
            }
            catch (err) {
                console.log(err);
                $('.loader').hide();
                $('#background-shadow').hide();
            }
        } else {
            toastr["error"]("Please check your data");
        }
    });

    // Delete account
    $(document).on('click', '.btn-delete-account', async function () {
        const fullInput = document.querySelector('#userId').value;
        var customId = fullInput.substring(7);

        if (confirm("Are you sure to delete your account?")) {

            $('.loader').show();
            $('#background-shadow').show();

            try {
                const res = await fetch('/deleteAccount', {
                    method: 'POST',
                    body: JSON.stringify({ customId }),
                    headers: { 'Content-Type': 'application/json' }
                });

                const data = await res.json();
                $('.loader').hide();
                $('#background-shadow').hide();
                $("#table-dashboard-alert").load(location.href + " #table-dashboard-alert");

                if (data.errors) {
                    toastr["error"](data.errors.message)
                }
                if (data.result) {
                    location.assign('/');
                }
            }
            catch (err) {
                console.log(err);
            }
        }
    });

    // Delete alert
    $(document).on('click', '#btn-delete-alert', async function () {
        var collection_name = $(this).closest('tr').find('a').attr('id');
        var collection_price = $(this).closest('tr').find('td:nth-child(3)').text();
        const fullInput = document.querySelector('#userId').value;
        var customId = fullInput.substring(7);

        $('.loader').show();
        $('#background-shadow').show();

        try {
            const res = await fetch('/deleteAlert', {
                method: 'POST',
                body: JSON.stringify({ collection_name, collection_price, customId }),
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await res.json();

            $('.loader').hide();
            $('#background-shadow').hide();
            $("#table-dashboard-alert").load(location.href + " #table-dashboard-alert");

            if (data.errors) {
                emailError.textContent = data.errors.email;
            }
        }
        catch (err) {
            console.log(err);
        }
    });

    // TOGGLE DIV FORGOT PASSWORD
    $(document).on('click', '.btn-display-change-password', function () {
        $(".btn-display-change-password i").toggleClass("down");
        $("#change-password").toggle( 'slow' );
        $('.btn-display-change-password i').toggleClass("fa-caret-down fa-caret-up");
    });

    // CHANGE PASSWORD
    $(document).on('click', '.btn-change-password', async function (e) {
        e.preventDefault();
        // const form              = document.querySelector('#change-password-form');
        const oldPassword       = $("#change-password-form input[name=oldPassword]").val()
        const newPassword       = $("#change-password-form input[name=newPassword]").val()
        const newPasswordBis    = $("#change-password-form input[name=newPasswordBis]").val()
        const fullInput         = document.querySelector('#userId').value;
        const customId            = fullInput.substring(7);

        if ( oldPassword !== "" && newPassword !== "" && newPasswordBis !== "" && customId !== "" ) {
            if ( newPassword == newPasswordBis ) {
                if ( oldPassword != newPassword ) {
                    try {
                        const res = await fetch('/changePassword', {
                            method: 'POST',
                            body: JSON.stringify({ oldPassword, newPassword, customId }),
                            headers: { 'Content-Type': 'application/json' }
                        });

                        const data = await res.json();


                        if (data.errors) {
                            toastr["error"](data.errors.message)
                        }
                        if (data.result) {
                            location.assign('/');

                        }
                    }
                    catch (err) {
                        console.log(err);
                    }
                } else {
                    toastr["error"]("The new password is the same than the new one");
                }
            } else {
                toastr["error"]("The new passwords doesn't match");
            }
        } else {
            toastr["error"]("Please check your data");
        }
    });



    // SHOW CHART COLLECTION
    $(document).on('click', '#btn-show-graph-fp', async function () {
        $(this).prop("disabled",true);

        const collection_name = document.getElementById('slug').textContent;

        // var collection_name = "sandbox";
        const ctx = document.getElementById('chartCollection').getContext('2d');

        try {
            const res = await fetch('/showChartCollection', {
                method: 'POST',
                body: JSON.stringify({ collection_name }),
                headers: { 'Content-Type': 'application/json' }
            });

            const result = await res.json();

            if ( result.type == 'success') {

                $('.chart-collection-section').show();
                Chart.defaults.plugins.legend = false;

                const custom_canvas_background_color = {
                    id: 'custom_canvas_background_color',
                    beforeDraw: (chart, args, options) => {
                    const {
                        ctx,
                        chartArea: { top, right, bottom, left, width, height },
                    } = chart;
                    ctx.save();
                    ctx.fillStyle = '#13131e';
                    ctx.fillRect(left, top, width, height);
                    ctx.restore();
                    },
                };


                const myChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        datasets: [{
                            data: result.data,
                            borderColor: '#9dd155',
                        }],
                    },
                    plugins: [custom_canvas_background_color],
                    options: {
                        parsing: {
                            xAxisKey: 'date',
                            yAxisKey: 'floor_price'
                        },
                        scales: {
                            x: {
                                ticks: {
                                    autoSkip: true,
                                    maxTicksLimit: 8
                                }
                            }
                        }
                    }
                });

            } else {
                toastr["error"](result.data);
            }
        }
        catch (err) {
            toastr["error"]("ERROR");
        }
    });


    // OPEN DETAILS COLLECTIONS
    $(document).on('click', '#btn-details', async function () {
        var collection_name = $(this).closest('tr').find('a').attr('id');
        const fullInput = document.querySelector('#userId').value;


        let newURL = `/collection/${collection_name}`;
        window.location = newURL;    // will cause browser to go to that pa

    });



    // DELETE COLLECTION BUTTON
    $(document).on('click', '#btn-delete', async function () {
        var collection_name = $(this).closest('tr').find('a').attr('id');

        const fullInput = document.querySelector('#userId').value;
        var customId = fullInput.substring(7);
        $('.loader').show();
        $('#background-shadow').show();

        try {
            const res = await fetch('/deleteCollection', {
                method: 'POST',
                body: JSON.stringify({ collection_name, customId }),
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await res.json();

            $('.loader').hide();
            $('#background-shadow').hide();
            $("#arrayFloorPrice").load(location.href + " #arrayFloorPrice");

            if (data.errors) {
                emailError.textContent = data.errors.email;
            }
        }
        catch (err) {
            console.log(err);
        }
    });

    $("#flexSwitchCheckEmail").on("click", async function () {

        var fullInput = document.querySelector('#userId').value;
        var customId = fullInput.substring(7);
        var emailStatus = $('#flexSwitchCheckEmail').is(':checked');

        try {

            const res = await fetch('/switchStatusApps', {
                method: 'POST',
                body: JSON.stringify({ emailStatus, customId }),
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await res.json();

            if (data.result) {
                toastr["success"]("Status change done")
            } else {
                toastr["success"]("Failed to change status. Please try again later.")
            }

            if (data.errors) {
                toastr["success"]("Failed to change status. Please try again later.")
            }
        }
        catch (err) {
            console.log(err);
        }
    });

    $("#flexSwitchCheckDiscord").on("click", async function () {

        var fullInput = document.querySelector('#userId').value;
        var customId = fullInput.substring(7);
        var discordStatus = $('#flexSwitchCheckDiscord').is(':checked');

        try {

            const res = await fetch('/switchStatusApps', {
                method: 'POST',
                body: JSON.stringify({ discordStatus, customId }),
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await res.json();

            if (data.result) {
                toastr["success"]("Status change done")
            } else {
                toastr["success"]("Failed to change status. Please try again later.")
            }

            if (data.errors) {
                toastr["success"]("Failed to change status. Please try again later.")
            }
        }
        catch (err) {
            console.log(err);
        }
    });

    $("#flexSwitchCheckTelegram").on("click", async function () {

        var fullInput = document.querySelector('#userId').value;
        var customId = fullInput.substring(7);
        var telegramStatus = $('#flexSwitchCheckTelegram').is(':checked');

        try {
            const res = await fetch('/switchStatusApps', {
                method: 'POST',
                body: JSON.stringify({ telegramStatus, customId }),
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await res.json();
            if (data.result) {
                toastr["success"]("Status change done")
            } else {
                toastr["success"]("Failed to change status. Please try again later.")
            }

            if (data.errors) {
                toastr["success"]("Failed to change status. Please try again later.")
            }
        }
        catch (err) {
            console.log(err);
        }
    });

    $(document).on('click', ".switch-row #switch-notifications", async function () {
        var fullInput = document.querySelector('#userId').value;
        var custom_id = fullInput.substring(7);
        var collection_name = $(this).closest('tr').find('a').attr('id');
        var btnValue = $(this).val();
        var classbtn, text = "";

        if (btnValue == 1) {
            notifications_status = 0;
            classbtn = "switch-notif switch-notif-off";
            text = '<i class="fa-solid fa-bell-slash"></i>';
        } else {
            notifications_status = 1;
            classbtn = "switch-notif switch-notif-on";
            text = '<i class="fa-solid fa-bell"></i>';
        }


        try {
            const res = await fetch('/switchCollectionNotification', {
                method: 'POST',
                body: JSON.stringify({ notifications_status, collection_name, custom_id }),
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await res.json();

            if (data.type === "success") {
                $(this).html(text)
                $(this).prop('value', notifications_status);
                $(this).prop('class', classbtn);
                toastr["success"](data.message)
            } else if (data.type === "error") {
                $(this).prop('value', false);
                $(this).prop('class', "switch-notif switch-notif-off");
                $(this).html('<i class="fa-solid fa-bell-slash"></i>')
                toastr["error"](data.message)
            } else {
                toastr["success"]("Failed to change status. Please try again later.")
            }
        }
        catch (err) {
            console.log(err);
        }
    });


    $(document).on('click', '#dscnt-btn-wallet', async function (e) {
        // const wallet_address = document.querySelector("#wallet-address").value;
        const wallet_address = "";
        const custom_id = $("#custom_id").text();

        $('.loader').show();
        $('#background-shadow').show();

        try {
            const res = await fetch('/dscntWalletAddress', {
                method: 'POST',
                body: JSON.stringify({ wallet_address, custom_id }),
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();

            $('.loader').hide();
            $('#background-shadow').hide();
            $("main").load(location.href + " main");

            if (data.type == "success") {

                toastr["success"](data.message)
            } else {
                toastr["error"](data.message)
            }
        } catch (err) {
            $('.loader').hide();
            $('#background-shadow').hide();
            toastr["error"](err.message)
        }
    });

    $(document).on('click', '#btn-wallet', async function (e) {
        e.preventDefault();

        const wallet_address = document.querySelector("#wallet-address").value;
        const custom_id = $("#custom_id").text();

        // var wallet_address = "0xe6002882e5cBad65bEA511853136fa31F2187169";
        // var wallet_address = "0x8888888888e9997e64793849389a8faf5e8e547c";
        // var wallet_address = "0xA99A76dDdBB9678bc33F39919Bc76d279C680C89";

        if (wallet_address !== "") {
            $('.loader').show();
            $('#background-shadow').show();

            try {
                const res = await fetch('/submitWalletAddress', {
                    method: 'POST',
                    body: JSON.stringify({ wallet_address, custom_id }),
                    headers: { 'Content-Type': 'application/json' }
                });
                const data = await res.json();
                setTimeout(
                function()
                {
                    $('.loader').hide();
                    $('#background-shadow').hide();
                    $("main").load(location.href + " main");
                }, 3000);

                if (data.type == "success") {
                    toastr["success"](data.message)
                } else {
                    toastr["error"](data.message)
                }
            } catch (err) {
                $('.loader').hide();
                $('#background-shadow').hide();
                toastr["error"](err.message)
            }
        } else {
            toastr["error"]("Please check your data");
        }
    });

    $(function () {
        $('[data-toggle="tooltip"]').tooltip()
      })

    function reveal() {
        var reveals = document.querySelectorAll(".reveal");

        for (var i = 0; i < reveals.length; i++) {
          var windowHeight = window.innerHeight;
          var elementTop = reveals[i].getBoundingClientRect().top;
          var elementVisible = 50;

          if (elementTop < windowHeight - elementVisible) {
            reveals[i].classList.add("active");
          } else {
            // reveals[i].classList.remove("active");
          }
        }
      }

    //   $(document).on('click', '.nft-card', async function (e) {
    //     // window.location = $(this).find(".nft-opensea").attr("href", "_blank");
    //     window.open( $(this).querySelector(".nft-opensea").getAttribute("href"), "_blank");
    //     return false;
    //   });

      window.addEventListener("scroll", reveal);


      $('input[type=radio][name="flexRadioDefault"]').on('change', function() {
            var currency = this.id

    });


    $(document).on('click', '.btn-check-mail', async function () {

        var email = $("#usermail").text();
        var fullInput = document.querySelector('#userId').value;
        var custom_id = fullInput.substring(7);
        $(this).prop("disabled", true);

        try {
            const res = await fetch('/checkUserMail', {
                method: 'POST',
                body: JSON.stringify({ email, custom_id}),
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();

            if (data.type == "success") {
                toastr["success"](data.message)
            } else {
                toastr["error"](data.message)
            }
        } catch (err) {
            toastr["error"](err.message)
        }
    });

    $( window ).on( "load", function() {

        var telegramStatus = $('#flexSwitchCheckTelegram').prop('disabled');
        var discordStatus = $('#flexSwitchCheckDiscord').prop('disabled');

        if ( telegramStatus && discordStatus ||  telegramStatus == undefined && discordStatus == undefined) {
            $('#modalWelcome').modal()
        }
    });
})(jQuery);
