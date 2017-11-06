$(document).foundation()
$(function () {

    // Returns width of browser viewport
    var browser = $(window).width();
    // Returns width of HTML document
    var document = $(document).width();

    $('.nav .toggle-nav').click(function (e) {
        $('.nav .nav-mobile').addClass('style-mobile').slideToggle('slow');
        e.preventDefault();
    });

});


$(window).scroll(function () { // check if scroll event happened
    if ($(document).scrollTop() > 80) { // check if user scrolled more than 50 from top of the browser window
        $(".nav").css("background-color", "white");
        $(".nav a").css("line-height", "50px");
        $(".nav").css("height", "65px");
        $(".nav").css("box-shadow", "0 4px 5px -2px rgba(0, 0, 0, .22), 0 2px 1px -1px rgba(0, 0, 0, .05)");
        $(".nav").css("min-height", "50px");
        $(".nav a").css("color", "black");
        document.getElementById("bitsokoLogo").src = "./images/bitsoko3.png";
    } else {
        $(".nav").css("background-color", "transparent");
        $(".nav a").css("line-height", "70px");
        $(".nav a").css("color", "white");
        $(".nav").css("height", "70px");
        $(".nav").css("box-shadow", "none");
        $(".nav").css("min-height", "80px");
        document.getElementById("bitsokoLogo").src = "./images/bitsoko.png";
    }
});



//SLIDER
var slides = document.querySelectorAll('#slides .slide');
var currentSlide = 0;
var slideInterval = setInterval(nextSlide, 5000);

function nextSlide() {
    slides[currentSlide].className = 'slide';
    currentSlide = (currentSlide + 1) % slides.length;
    slides[currentSlide].className = 'slide showing';
}

var slides2 = document.querySelectorAll('#slides2 .slide2');
var currentSlide2 = 0;
var slideInterval2 = setInterval(nextSlide2, 5000);

function nextSlide2() {
    slides2[currentSlide2].className = 'slide2';
    currentSlide2 = (currentSlide2 + 1) % slides2.length;
    slides2[currentSlide2].className = 'slide2 showing2';
}
//preloader
// makes sure the whole site is loaded
jQuery(window).load(function () {
    // will first fade out the loading animation
    jQuery("#status").fadeOut();
    // will fade out the whole DIV that covers the website.
    jQuery("#preloader").delay(1000).fadeOut("slow");
})
