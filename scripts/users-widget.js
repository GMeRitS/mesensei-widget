(function() {
    var jQuery;
    
    /******** Load jQuery if not present *********/
    if (window.jQuery === undefined || window.jQuery.fn.jquery !== '2.2.4') {
        var script_tag = document.createElement('script');
        script_tag.setAttribute("type","text/javascript");
        script_tag.setAttribute("src",
            "https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js");
        if (script_tag.readyState) {
          script_tag.onreadystatechange = function () { // For old versions of IE
              if (this.readyState == 'complete' || this.readyState == 'loaded') {
                  scriptLoadHandler();
              }
          };
        } else {
          script_tag.onload = scriptLoadHandler;
        }
        // Try to find the head, otherwise default to the documentElement
        (document.getElementsByTagName("head")[0] || document.documentElement).appendChild(script_tag);
    } else {
        // The jQuery version on the window is the one we want to use
        jQuery = window.jQuery;
        main();
    }

    /******** Called once jQuery has loaded ******/
    function scriptLoadHandler() {
        // Restore $ and window.jQuery to their previous values and store the
        // new jQuery in our local jQuery variable
        jQuery = window.jQuery.noConflict(true);
        // Call our main function
        main(); 
    }

    /******** Start helpers ******/
    function get($, url, params, callback) {
        $.ajax({
            async: true,
            dataType: 'jsonp',
            url: url,
            data: params,
            success: callback
        });
    }
    /******** End helpers ******/

    function render($, data) {
        if(data && data.widget && data.widget.users) {
            var renderedObj = renderContentContainer($, data);
            $('.mesensei-users-widget').append([
                renderedObj.searchForm, 
                renderedObj.sampleTopicList, 
                renderedObj.widgetContent.append(renderedObj.gridWidgetContainer)
            ]);
        }
    }

    function renderContentContainer($, data) {
        var searchForm = $('<form>');
        searchForm.attr('id', 'search-form');
        searchForm.append([
            $('<input>').attr( {type: 'text', placeHolder: 'Search', class: 'search-input', id: 'search-input'} ), 
            $('<button />').attr({ 
                class: 'search-button', 
                id: 'search-button'
            }).prepend($('<img>').attr({id: 'search-button-image', src : './images/icon-search.png', alt: ''} ))
        ]);
        var widgetContent = $('<div>');
        widgetContent.attr({ class: 'widget-content-container', id: 'widget-content-container' });
        
        var gridWidgetContainer = $('<div>');
        gridWidgetContainer.attr('class', 'grid-widget-container');

        var sampleTopicList = $('<div>');
        var listOfTopics = $('<p>').attr('id', 'topics')

        sampleTopicList.attr('class', 'topic-list');
        $.each(data.widget.topics, function(key, topic) {
            listOfTopics.append($('<a>').attr({ id: topic.id, href: `#${key}`, class: 'topic-link' }).html(topic.name))
            if(key !== data.widget.topics.length - 1)
                listOfTopics.append(', ');
        });
        
        sampleTopicList.append([
            $('<button/>').attr({ id: 'show-hide-topic-button' }).html('List topics'),
            listOfTopics
        ]);
        
        $.each(data.widget.users, function(key, user) {
            var gridWidgetItem = $('<div>');
            gridWidgetItem.attr('class', 'grid-widget-item');

            var userImageContainer = $('<div>');
            userImageContainer.attr('class', 'profile-image-container');
            if(user.image_url === null || user.image_url === '') {
                userImageContainer.prepend($('<img>').attr({src: './images/default-user-avatar.png', alt: ''} ));    
            } 
            else {
                userImageContainer.prepend($('<img>').attr({src: `${user.image_url}`, alt: ''} ));
            }
            
            var userName = $('<p>');
            userName.attr('class', 'user-name');
            userName.html(user.username);

            var userTopics = $('<div>');
            var userTopicList = $('<ul>');
            userTopics.attr('class', 'topics-container');
            
            if(user.topics.length > 0) {
                userTopics.append($(userTopicList));
                user.topics.slice(0, 3).map(function(val) {
                    userTopicList.append(`<li><p>${val.name}</p></li>`);
                })
            } 
            else {
                userTopics.append($('<p>').attr('class', 'no-topic-label').html('No topics available'))
            }

            var seeMoreButton = $('<a/>');

            if(user.website !== null && (user.website.substring(0, 8) === 'https://' || user.website.substring(0, 8) === 'http://')) {
                seeMoreButton.attr({class: 'see-more-button', id : 'see-more-button', href: `${user.website}`, target: '_blank'}).append([
                    $('<p>').html('See more'),
                    $('<img>').attr({src: './images/arrow-see-more.png', class: 'see-more-arrow', alt: ''})
                ])
            }

            gridWidgetItem.append([userImageContainer, userName, userTopics, seeMoreButton]);
            gridWidgetContainer.append(gridWidgetItem);
        });
        
        return {
            searchForm: searchForm,
            sampleTopicList: sampleTopicList,
            widgetContent: widgetContent,
            gridWidgetContainer: gridWidgetContainer
        }
    }

    function main() { 
        jQuery(document).ready(function($) { 
            var jsonp_url = "https://api.mesensei.com/content/widget/";

            $('.mesensei-users-widget').each(function(i){
                var css_link = $('<link>', { 
                    rel: 'stylesheet', 
                    type: 'text/css', 
                    href: './styles/users-widget.css'
                });
                var mobileResponsiveMeta_link = $('<meta>', {
                    name: 'viewport',
                    content: 'width=device-width, initial-scale=1'
                });
                var font_link = $('<link>', {
                    rel: 'stylesheet',
                    href: 'https://fonts.googleapis.com/css?family=Open+Sans:300,300i,400,400i,600,600i,700,700i,800,800i&display=swap'
                })

                $('head').append([css_link, mobileResponsiveMeta_link, font_link]);

                var id = "mesensei" + Math.floor( Math.random() * 1000000 );
                this.id = id;
                var key = $(this).attr("data-mesensei-key");
                var url = jsonp_url + key;
                
                $(document).on('click', '#search-button', (function(e) {
                    e.preventDefault();
                    var searchInputValue = $('#search-input').val();
                    if(searchInputValue !== '' && $('#search-button-image').attr('src') == './images/icon-search.png') {                    
                        $('#search-button-image').attr('src', './images/icon-close.png');
                        get($, url, { key: key, search: searchInputValue }, function(data) {
                            var renderedObj = renderContentContainer($, data);
                            $("#widget-content-container").html(renderedObj.gridWidgetContainer);
                        });
                    }
                    else {
                        $('#search-button-image').attr('src', './images/icon-search.png');
                        $('#search-input').val('');
                        get($, url, { key: key, search: '' }, function(data) {
                            var renderedObj = renderContentContainer($, data);
                            $("#widget-content-container").html(renderedObj.gridWidgetContainer);
                        }); 
                    }
                }))

                get($, url, { key: key }, function(data) {
                    render($, data);
                });
                
                $(document).on('keyup', '#search-input', function() {
                    if($('#search-input').val() === '') {
                        $('#search-button-image').attr('src', './images/icon-search.png');
                        get($, url, { key: key, search: $('#search-input').val() }, function(data) {
                            var renderedObj = renderContentContainer($, data);
                            $("#widget-content-container").html(renderedObj.gridWidgetContainer);
                        }); 
                    }
                })

                $(document).keypress(function (e) {
                    if (e.keyCode === 10 || e.keyCode === 13) {
                        e.preventDefault();
                    }
                });

                $(document).on('click', '.topic-list', function(e) {
                    e.preventDefault();
                    if($('#show-hide-topic-button').text() === 'List topics') {
                        $('#show-hide-topic-button').html('Hide topics');
                        $('#topics').css('display', 'block');
                        $('.widget-content-container').css('paddingTop', '60px'); 
                        $('.topic-link').click(function(){
                            var topic = $(this).text(); 
                            $('.search-input').val(topic);
                            if(topic !== '' || $('#search-button-image').attr('src') == './images/icon-search.png') {     
                                $('#search-button-image').attr('src', './images/icon-close.png');               
                                get($, url, { key: key, search: topic }, function(data) {
                                    var renderedObj = renderContentContainer($, data);
                                    $("#widget-content-container").html(renderedObj.gridWidgetContainer);
                                }); 
                            }
                        })
                    } 
                    else {
                        $('#show-hide-topic-button').html('List topics');
                        $('#topics').css('display', 'none');
                        $('.widget-content-container').css('paddingTop', '48px'); 
                    }
                })
            });
        })
    }
})(); 

