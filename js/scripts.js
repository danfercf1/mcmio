function centrar($container){
    var top, left;

    $footer = $('.footer_links');

    $header = $('.header_links');

    var innerHeight = window.innerHeight;
    var outerHeight = window.outerHeight;
    var midH_cont = $container.height() / 2;
    var midH_win = innerHeight / 2;

    var innerWidth = window.innerWidth;
    var outerWidth = window.outerWidth;
    var midW_cont = $container.width() / 2;
    var midW_win = innerWidth / 2;

    /*Centrar Container*/

    if(innerWidth == 1024){
        top = (midH_win - midH_cont)*0.7;
        left = (midW_win - midW_cont);
        $($container).css({'left' : left+"px", 'top': top+'px'});
        $($header).css({'margin-top' : "38px"});
    }else{
        top = midH_win - midH_cont;
        left = (midW_win - midW_cont);
        $($container).css({'left' : left+"px", 'top': top+'px'});
    }

    /*Centrar header y footer*/

    midW_foot = $footer.width();

    margin = (innerWidth - midW_foot)/2;

    $($footer).css({'margin-left' : margin+"px"});

    $($header).css({'margin-left' : margin+"px"});

}

$container = $('.container');

window.onresize=function(){
    centrar($container);
};