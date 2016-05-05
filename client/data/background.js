// There is nothing but ugly hacks beyond this point.
// Stop here if you value your sanity.

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

function removedMessageShower() {
    function showDeletedMessage(message) {

        var parent = message.parents(".message-group");
        var userName = parent.find(".user-name");

        var replyButton = $("<div class='reply-button'>↳</div>");
        
        replyButton.click(function(){
            var replyBox = $(".channel-textarea textarea");
            replyBox.val('↰' + parseID(message.data('reactid')) + ' @' + userName.text() + ' ' + replyBox.val());
            replyBox.focus();
        });

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

        message.prepend(replyButton);
    };

    function lookForMoreDeletedMessages() {
        return Array.from($(".message-text"));
    }

    pollForDomNodes(lookForMoreDeletedMessages, showDeletedMessage);
}

$(function(){
    removedMessageShower();
});
