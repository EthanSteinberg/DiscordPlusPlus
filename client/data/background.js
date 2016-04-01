// There is nothing but ugly hacks beyond this point.
// Stop here if you value your sanity.

var host = 's://stargazerserver.me';

function findNthIndex(string, character, n) {
    var lastIndex = 0;
    for (var i = 0; i < n; i++) {
        lastIndex = string.indexOf(character, lastIndex+1);
    }

    return lastIndex;
}

function parseID(id) {
    var lastDollar = findNthIndex(id, '$', 3);
    var dot = id.indexOf('.', lastDollar);
    var finalString = id.substring(lastDollar+1, dot);
    return finalString;
}

function pollForDomNodes(query, init) {
    var nodes = [];
    function poll() {
        var newNodes = query().filter(function(newNode) {
            return nodes.indexOf(newNode) === -1;
        });

        for (var newNode of newNodes) {
            nodes.push(newNode);
            init($(newNode));
        }
    }
    poll();
    window.setInterval(poll, 1000);
}

var lastThingy = null;

function postJSON(location, data) {
    $.ajax({
        type: "POST",
        url: 'http' + host + "/" + location,
        data: JSON.stringify(data),
        contentType: "application/json; charset=utf-8",
    });
}

function getStarData(id, callback) {
    return $.ajax({
        type: "GET",
        url: 'http' + host + "/star_data",
        data: {id: id},
        success: callback,
    });
}

function getUserName() {
    return $("#app-mount > div > div.app.flex-vertical.theme-light > div > section > div.flex-vertical.channels-wrap > div.account > div.account-details > span.username").text();
}

function toggleStar(destination, text, author) {
    var userName = getUserName();

    postJSON("toggle_star", {
        sender: userName,
        destination: destination,
        text: text,
        author: author,
    });
}

function createStarButtonFromData(id, text, author, stardata) {
    var name = getUserName();
    var count = 0;

    for (var name in stardata) {
        if (name != '' && stardata[name]) {
            count++;
        }
    }

    return createStarButton(id, text, author, stardata[name], count);
}

function createStarButton(id, messageText, author, havePressed, count) {
    var text = null;
    if (count == 0 || count == 1) {
        text = '';
    } else {
        text = count.toString();
    }

    var starClass = null;
    var src = null;
    if (havePressed) {
        starClass = "visible-star-button";
        src = 'data/poop.png';
    } else if (count == 0) {
        starClass = "hidden-star-button";
        src = 'data/grayPoop.png';
    } else {
        starClass = "visible-star-button";
         src = 'data/grayPoop.png';
    }

    var starButton = $("<span class='star-button'></div>");
    starButton.addClass(starClass);

    var countText = $("<span>");
    countText.text(text);
    starButton.append(countText);


    var starImg = $("<img class='star-img'>");
    starImg.attr('src', chrome.extension.getURL(src));
    starButton.append(starImg);

    starButton.click(function(){
        toggleStar(id, messageText, author);
    });

    return starButton;
}

function getTotalText(message) {
    var result = '';
    message.children('.markup').children().each(function(index, item) {
        var actualText = $(item).text();
        result += actualText;
    });
    return result;
}

function getAuthor(message) {
    var parent = message.parents(".message-group");
    var userName = parent.find(".user-name");
    return userName.text();
}

function removedMessageShower() {
    function showDeletedMessage(message) {

        var parent = message.parents(".message-group");
        var userName = parent.find(".user-name");
        var id = parseID(message.data('reactid'));

        var replyButton = $("<div class='reply-button'>↳</div>");

        replyButton.click(function(){
            var replyBox = $(".channel-textarea textarea");
            replyBox.val('↰' + id + ' @' + userName.text() + ' ' + replyBox.val());
            replyBox.focus();
        });

        message.prepend(replyButton);

        var text = message.children('.markup').children();
        text.each(function(index, item) {
            var actualText = $(item).text();
            if (actualText.indexOf('↰') !== -1) {
                var startOfNumber = actualText.indexOf('↰') + 1;
                var endOfNumber = actualText.indexOf(' ', startOfNumber);
                if (endOfNumber === -1) {
                    endOfNumber = actualText.length;
                }
                var resultingNumber = actualText.substring(startOfNumber, endOfNumber);

                var id = parseInt(resultingNumber, 10);
                if (!Number.isNaN(id)) {
                    var beforeSplit = $('<span>');
                    beforeSplit.text(actualText.substring(0, startOfNumber-1));
                    var afterSplit = $('<span>');
                    afterSplit.text(actualText.substring(endOfNumber));

                    $(item).before(beforeSplit);
                    $(item).after(afterSplit);

                    $(item).text('↰');
                    $(item).css({cursor: 'pointer', color: 'grey'});
                    $(item).click(function() {
                        var scroller = $(".scroller.messages");

                        function findOrContinue() {
                            var messages = $(".message-text");

                            for (var index = 0; index < messages.length; index++) {
                                otherMessage = messages[index];
                                var otherMessageId = parseID($(otherMessage).data('reactid'));

                                if (otherMessageId == id) {
                                    var parent = $(otherMessage).parents(".message-group");
                                    parent[0].scrollIntoView(true);
                                    $(otherMessage).css({'background-color': 'yellow'});
                                    setTimeout(function(){
                                        $(otherMessage).css({'background-color': ''});
                                    }, 3000);
                                    return;
                                }
                            }


                            scroller[0].scrollTop = 0;
                            // I wasn't able to find it :(

                            var emptyMessages = $(".empty-message");
                            if (emptyMessages.length !== 0) {
                                return;
                            }

                            setTimeout(findOrContinue, 1000);
                        }

                        findOrContinue();
                    });
                }
            }
        });
        getStarData(id, function(data) {
            var starButton = createStarButtonFromData(id, getTotalText(message), getAuthor(message), data);

            message.prepend(starButton);
        });
    };

    function lookForMoreDeletedMessages() {
        return Array.from($(".message-text"));
    }

    pollForDomNodes(lookForMoreDeletedMessages, showDeletedMessage);
}

function getCounts(stardata) {
    var counts = {};

    for (var id in stardata) {
        var count = 0;

        for (var name in stardata[id]) {
            if (name != '' && stardata[id][name]) {
                count++;
            }
        }

        counts[id] = count;
    }

    return counts;
}

function getBoardData(stardata) {
    var userName = getUserName();
    var counts = getCounts(stardata);
    var nonZeroOnes = Object.keys(stardata).filter(function(id) { return counts[id] > 0; });
    nonZeroOnes.sort(function(a, b) { return counts[b] - counts[a];});

    var result = [];

    for (var i = 0; i < Math.min(10, nonZeroOnes.length); i++) {
        var id = nonZeroOnes[i];
        var data = stardata[id];
        result.push({
            id: id,
            messageText: data[''].text,
            author: data[''].author,
            havePressed: data[userName],
            count: counts[id],
        });
    }

    return result;
}

function createStarBoard(stardata) {
    var data = getBoardData(stardata);

    var result = $("<span class='star-board'>");
    result.append($("<h2><span>ShitBoard</span></h2>"));

    for (var i = 0; i < data.length; i++) {
        var entryData = data[i];

        var entry = $("<div class='star-board-entry'>");
        var text = $("<span/>");

        entry.append(createStarButton(entryData.id, entryData.messageText, entryData.author, entryData.havePressed, entryData.count));

        text.text(entryData.messageText + ' - ' + entryData.author);

        entry.append(text);


        result.append(entry);
    }

    return result;
}

function starboardShower() {
    function showStarboard(board) {
        getStarData(undefined, function(data) {
            board.prepend(createStarBoard(data));
        });
    };

    function lookForBoard() {
        return Array.from($(".channel-members"));
    }

    pollForDomNodes(lookForBoard, showStarboard);
}

function updateStars(info) {
    var messages = $(".message-text");

    for (var index = 0; index < messages.length; index++) {
        var otherMessage = $(messages[index]);
        var otherMessageId = parseID(otherMessage.data('reactid'));

        for (var id in info) {
            if (otherMessageId == id) {
                otherMessage.find('.star-button').remove();
                otherMessage.prepend(createStarButtonFromData(id, getTotalText(otherMessage), getAuthor(otherMessage), info[id]));
            }
        }
    }
    $('.star-board').replaceWith(createStarBoard(info));
}

$(function(){
    removedMessageShower();
    starboardShower();

    var socket = new WebSocket('ws' + host + '/ws/');
    socket.onmessage = function(e) {
        var message = JSON.parse(e.data);

        switch (message.type) {
            case 'updateStars':
                updateStars(message.data);

                break;
            default:
                console.error('Unknown message type:', message.type);
                break;
        }
    };
});
