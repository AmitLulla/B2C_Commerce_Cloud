'use strict';
var keyboardAccessibility = require('base/components/keyboardAccessibility');
var constants = {
    isDesktop: window.screen.width > 640 ? true : false,
    focus: null
}
var DOMElements = {
    body: document.querySelector('body'),
    header: document.querySelector('header'),
    footer: document.querySelector('mobile-section'),
    menu:{
        main: document.querySelector('.main-menu'),
        dropdowns: document.querySelectorAll('.dropdown:not(.disabled) [data-toggle="dropdown"]'),
        otherOptions: document.querySelectorAll('.other-options .title')
    }
}

var clearSelection = function (element) {
    $(element).closest('.dropdown.show').removeClass('show');
    $(element).closest('.dropdown-menu.show').removeClass('show');
};

function hideMenu(element){
    if(!element) return;
    element.classList.remove('show')
    var menus = element.querySelectorAll('ul.dropdown-menu');
    var items = element.querySelectorAll('li.dropdown-item');
    menus.length && menus.forEach(function(menu){ menu.classList.remove('show') })
    items.length && items.forEach(function(item){ item.classList.remove('show') })
}

var isDesktop = function () {
    return window.screen.width > 640 ? true : false;
};
module.exports = function () {
    stickyHeader();
    //stickyFooter();
    clickSearch();
    deployListCategoriesToMenu();


    var headerBannerStatus = window.sessionStorage.getItem('hide_header_banner');
    $('.header-banner .close').on('click', function () {
        $('.header-banner').addClass('d-none');
        window.sessionStorage.setItem('hide_header_banner', '1');
    });

    if (!headerBannerStatus || headerBannerStatus < 0) {
        $('.header-banner').removeClass('d-none');
    }

    keyboardAccessibility('.main-menu .nav-link, .main-menu .dropdown-link',
        {
            40: function (menuItem) { // down
                if (menuItem.hasClass('nav-item')) { // top level
                    $('.navbar-nav .show').removeClass('show')
                        .children('.dropdown-menu')
                        .removeClass('show');
                    menuItem.addClass('show').children('.dropdown-menu').addClass('show');
                    menuItem.find('ul > li > a')
                        .first()
                        .focus();
                } else {
                    menuItem.removeClass('show').children('.dropdown-menu').removeClass('show');
                    if (!(menuItem.next().length > 0)) { // if this is the last menuItem
                        menuItem.parent().parent().find('li > a') // set focus to the first menuitem
                        .first()
                        .focus();
                    } else {
                        menuItem.next().children().first().focus();
                    }
                }
            },
            39: function (menuItem) { // right
                if (menuItem.hasClass('nav-item')) { // top level
                    menuItem.removeClass('show').children('.dropdown-menu').removeClass('show');
                    $(this).attr('aria-expanded', 'false');
                    menuItem.next().children().first().focus();
                } else if (menuItem.hasClass('dropdown')) {
                    menuItem.addClass('show').children('.dropdown-menu').addClass('show');
                    $(this).attr('aria-expanded', 'true');
                    menuItem.find('ul > li > a')
                        .first()
                        .focus();
                }
            },
            38: function (menuItem) { // up
                if (menuItem.hasClass('nav-item')) { // top level
                    menuItem.removeClass('show').children('.dropdown-menu').removeClass('show');
                } else if (menuItem.prev().length === 0) { // first menuItem
                    menuItem.parent().parent().removeClass('show')
                        .children('.nav-link')
                        .attr('aria-expanded', 'false');
                    menuItem.parent().children().last().children() // set the focus to the last menuItem
                        .first()
                        .focus();
                } else {
                    menuItem.prev().children().first().focus();
                }
            },
            37: function (menuItem) { // left
                if (menuItem.hasClass('nav-item')) { // top level
                    menuItem.removeClass('show').children('.dropdown-menu').removeClass('show');
                    $(this).attr('aria-expanded', 'false');
                    menuItem.prev().children().first().focus();
                } else {
                    menuItem.closest('.show').removeClass('show')
                        .closest('li.show').removeClass('show')
                        .children()
                        .first()
                        .focus()
                        .attr('aria-expanded', 'false');
                }
            },
            27: function (menuItem) { // escape
                var parentMenu = menuItem.hasClass('show')
                    ? menuItem
                    : menuItem.closest('li.show');
                parentMenu.children('.show').removeClass('show');
                parentMenu.removeClass('show').children('.nav-link')
                    .attr('aria-expanded', 'false');
                parentMenu.children().first().focus();
            }
        },
        function () {
            return $(this).parent();
        }
    );

    $('.navbar>.close-menu>.close-button').on('click', function (e) {
        e.preventDefault();
        $('.menu-toggleable-left').removeClass('in');
        $('.modal-background').hide();

        $('.navbar-toggler').focus();

        $('.main-menu').attr('aria-hidden', 'true');
        $('.main-menu').siblings().attr('aria-hidden', 'false');
        $('header').siblings().attr('aria-hidden', 'false');
    });

    $('.navbar-nav').on('click', '.close-button', function (e) {
        e.preventDefault();
        $('.navbar-nav').find('.top-category').detach();
        $('.navbar-nav').find('.nav-menu').detach();
        $('.navbar-nav').find('.show').removeClass('show');
        $('.menu-toggleable-left').removeClass('in');

        $('.main-menu').siblings().attr('aria-hidden', 'false');
        $('header').siblings().attr('aria-hidden', 'false');

        $('.modal-background').hide();
    });

    $('.navbar-toggler').click(function (e) {
        e.preventDefault();
        e.target.classList.toggle('close')
        DOMElements.body.classList.toggle('lock-scroll')
        $('.main-menu').toggleClass('in');

        $('.main-menu').removeClass('d-none');
        $('.main-menu').attr('aria-hidden', 'false');
        $('.main-menu').siblings().attr('aria-hidden', 'true');
        $('header').siblings().attr('aria-hidden', 'true');
        DOMElements.header.classList.add('fixed')
        DOMElements.footer.classList.add('bottom-fixed')
        $('.main-menu .nav.navbar-nav .nav-link').first().focus();
    });

    keyboardAccessibility('.navbar-header .user',
        {
            40: function ($popover) { // down
                if ($popover.children('a').first().is(':focus')) {
                    $popover.next().children().first().focus();
                } else {
                    $popover.children('a').first().focus();
                }
            },
            38: function ($popover) { // up
                if ($popover.children('a').first().is(':focus')) {
                    $(this).focus();
                    $popover.removeClass('show');
                } else {
                    $popover.children('a').first().focus();
                }
            },
            27: function () { // escape
                $('.navbar-header .user .popover').removeClass('show');
                $('.user').attr('aria-expanded', 'false');
            },
            9: function () { // tab
                $('.navbar-header .user .popover').removeClass('show');
                $('.user').attr('aria-expanded', 'false');
            }
        },
        function () {
            var $popover = $('.user .popover li.nav-item');
            return $popover;
        }
    );

    $('.navbar-header .user').on('mouseenter focusin', function () {
        if ($('.navbar-header .user .popover').length > 0) {
            $('.navbar-header .user .popover').addClass('show');
            $('.user').attr('aria-expanded', 'true');
        }
    });

    $('.navbar-header .user').on('mouseleave', function () {
        $('.navbar-header .user .popover').removeClass('show');
        $('.user').attr('aria-expanded', 'false');
    });
    $('body').on('click', '#myaccount', function () {
        event.preventDefault();
    });
};

function stickyHeader (){
    let DOMElementsFooter = null;
    let DOMElementsHeader = document.querySelector('header');
    let DOMElementsFooters = document.getElementsByClassName('mobile-section');
    if(!DOMElementsHeader) return;
    if(DOMElementsFooters.length>0){
        DOMElementsFooter=DOMElementsFooters[0];
    }
    // scroll event window
    var last_known_scroll_position = 0;
    var scroll_position_fixed = 1;
    window.addEventListener('scroll',(e)=>{
        last_known_scroll_position = window.scrollY;
        if(last_known_scroll_position > scroll_position_fixed){
            DOMElementsHeader.classList.add('fixed')
            DOMElementsFooter.classList.add('bottom-fixed')
        } 
        else {
            DOMElementsHeader.classList.remove('fixed')
        }
        if(window.scrollY < 50){
            DOMElementsFooter.classList.remove('bottom-fixed')
        }
    })
}


function clickSearch () {
    let searchFather = document.getElementsByClassName('site-search');
    let search = document.getElementsByClassName('search-icon');
    
    searchFather = searchFather.length ? searchFather[0] : false;
    search = search.length ? search[0] : false;
    
    if(!search && !searchFather) return;    

    search.addEventListener('click', (e) =>{
        e.preventDefault();
        searchFather.classList.add('active');
    })
}

function deployListCategoriesToMenu(){
    if(constants.isDesktop){
        const genders = document.querySelectorAll('.categories-genders > li');
        if(!genders.length) return;
        genders.forEach(el => onHoverItemMenu(el))
    }else{
        const navItems = document.querySelectorAll('.nav-item.dropdown');
        if(navItems.length){
            navItems[0].classList.add('show');
        } 
        onOtherOptionsHandler();
    }
    DOMElements.menu.dropdowns.forEach(function(dropdown){
        dropdown.addEventListener(`${constants.isDesktop ? 'mouseover':'click'}`,function(e){
            e.preventDefault()
            var categories = Array.from(dropdown.closest('[role*=menu]').children);
            var selectedMenu = dropdown.closest('[role*=presentation]')
            categories.filter(child => child !== parent && hideMenu(child))
            selectedMenu.classList.add('show')
            if(constants.isDesktop)
                selectedMenu.querySelector('.dropdown-menu').classList.add('show')
            else{
                if(!selectedMenu.querySelector('.dropdown-menu > .top-category')){
                    createBackElement(selectedMenu.querySelector('.dropdown-menu'),dropdown)
                }
            }
        })
    })
}
function onOtherOptionsHandler(){
    DOMElements.menu.otherOptions.forEach(function(item){
        item.addEventListener('click',function(e){
            e.stopPropagation();
            item.parentNode.classList.toggle('open')
        })
    })
}
/**
 * @param {Element} element
 * @param {Element} link
 * @description createBackElement()
 */
function createBackElement (element,link){
    const li = document.createElement('li');
    const contentBack = document.createElement('div')
    const clonedLink = link.cloneNode(true);

    li.classList.add('top-category')
    contentBack.classList.add('back')
    li.setAttribute('role','button');

    li.insertAdjacentElement('afterbegin',clonedLink);
    contentBack.insertAdjacentHTML('afterbegin','<span class="icon-back"></span>');
    if(!link.classList.contains('parent')) li.insertAdjacentElement('afterbegin',contentBack);

    element.insertAdjacentElement('afterbegin',li)

    contentBack.addEventListener('click',function(e){
        e.preventDefault();
        clearSelection(e.target);
    })
}
/**
 * @param {Element} element
 * @description onHoverItemMenu()
 * * @returns {Element}
 */
function onHoverItemMenu(element){
    constants.focus = !constants.focus && element;
    element.addEventListener('mouseover', (e)=>{
        e.stopPropagation();
        if(constants.focus != e.target){
            onToggleListMenuCategory(element);
            onToggleBackgroundEvent();
            constants.focus = element
        }
    } )
}
/**
 * @param {Element} element
 * @description onToggleListMenuCategory()
 */
function onToggleListMenuCategory(element){
    const gender = element.getAttribute('gender');
    const dropdownMenuGender = document.querySelector(`.dropdown-menu[class*=${gender}]`);
    const bannerGender = document.querySelector(`.wrapper-banners-menu div[class*=${gender}]`);
    if(dropdownMenuGender){
        removeClassSibling(element.parentElement.children,element,'show')
        removeClassSibling(document.querySelectorAll('.dropdown-menu'),dropdownMenuGender,'show')
        removeClassSibling(document.querySelectorAll('.wrapper-banners-menu > div'),bannerGender,'show')
    }
}

function removeClassSibling(items,element, toggleCLass){
    if(!element) return;
    const siblingsItem = Array.from(items);
    siblingsItem.filter(child => child !== element && child.classList.remove(toggleCLass))
    element.classList.add(toggleCLass)
}

function onToggleBackgroundEvent(){
    const background = document.querySelector('.modal-background');
    if(!background) return;

    !background.classList.contains('show') && background.classList.add('show');
    background.addEventListener('mouseover',()=>{
        background.classList.remove('show')
        document.querySelectorAll('.wrapper-banners-menu > div').forEach(el => el.classList.remove('show'))
        document.querySelectorAll('.dropdown-menu').forEach(el => el.classList.remove('show'))
    })
}
